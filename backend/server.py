from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import httpx
import io
import qrcode
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Stripe initialization
stripe_api_key = os.environ.get('STRIPE_API_KEY')

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============== PYDANTIC MODELS ==============

class UserBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str = Field(default_factory=lambda: f"user_{uuid.uuid4().hex[:12]}")
    email: str
    name: str
    picture: Optional[str] = None
    subscription_status: str = "free"
    subscription_expires_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SessionCreate(BaseModel):
    session_id: str

class CertificationModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    cert_id: str
    vendor: str
    name: str
    code: str
    difficulty: str
    description: str
    job_roles: List[str]
    exam_domains: List[Dict[str, Any]]
    labs_count: int
    assessments_count: int
    projects_count: int
    image_url: Optional[str] = None

class LabModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    lab_id: str
    cert_id: str
    title: str
    description: str
    skill_trained: str
    exam_domain: str
    duration_minutes: int
    difficulty: str
    instructions: List[Dict[str, Any]]
    prerequisites: List[str] = []

class AssessmentModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    assessment_id: str
    cert_id: str
    title: str
    description: str
    type: str
    topics: List[str]
    time_minutes: int
    pass_threshold: int
    questions: List[Dict[str, Any]]

class ProjectModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    project_id: str
    cert_id: str
    title: str
    description: str
    business_scenario: str
    technologies: List[str]
    difficulty: str
    skills_validated: List[str]
    tasks: List[Dict[str, Any]]
    deliverables: List[str]

class UserProgressModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    progress_id: str = Field(default_factory=lambda: f"prog_{uuid.uuid4().hex[:12]}")
    user_id: str
    cert_id: str
    labs_completed: List[str] = []
    assessments_completed: List[Dict[str, Any]] = []
    projects_completed: List[str] = []
    domain_scores: Dict[str, int] = {}
    readiness_percentage: int = 0
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LabCompletionRequest(BaseModel):
    lab_id: str
    cert_id: str

class AssessmentSubmission(BaseModel):
    assessment_id: str
    cert_id: str
    answers: Dict[str, str]

class ProjectCompletionRequest(BaseModel):
    project_id: str
    cert_id: str

class CheckoutRequest(BaseModel):
    plan: str
    origin_url: str

class BookmarkRequest(BaseModel):
    lab_id: str
    bookmarked: bool

class NoteRequest(BaseModel):
    lab_id: str
    content: str

class CertificateRequest(BaseModel):
    cert_id: str

# ============== AUTH HELPERS ==============

async def get_current_user(request: Request) -> Optional[Dict]:
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        return None
    
    session_doc = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session_doc:
        return None
    
    expires_at = session_doc.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    return user_doc

async def require_auth(request: Request) -> Dict:
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

# ============== AUTH ROUTES ==============

@api_router.post("/auth/session")
async def create_session(session_data: SessionCreate, response: Response):
    """Exchange session_id from Emergent Auth for session_token"""
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_data.session_id}
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            
            user_data = resp.json()
    except Exception as e:
        logger.error(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data["email"]}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user data
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": user_data["name"], "picture": user_data.get("picture")}}
        )
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        new_user = {
            "user_id": user_id,
            "email": user_data["email"],
            "name": user_data["name"],
            "picture": user_data.get("picture"),
            "subscription_status": "free",
            "subscription_expires_at": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(new_user)
    
    # Create session
    session_token = f"sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user_doc

@api_router.get("/auth/me")
async def get_me(user: Dict = Depends(require_auth)):
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie("session_token", path="/", samesite="none", secure=True)
    return {"message": "Logged out"}

# ============== CERTIFICATION ROUTES ==============

@api_router.get("/certifications", response_model=List[CertificationModel])
async def get_certifications():
    certs = await db.certifications.find({}, {"_id": 0}).to_list(100)
    return certs

@api_router.get("/certifications/{cert_id}")
async def get_certification(cert_id: str):
    cert = await db.certifications.find_one({"cert_id": cert_id}, {"_id": 0})
    if not cert:
        raise HTTPException(status_code=404, detail="Certification not found")
    return cert

# ============== LABS ROUTES ==============

@api_router.get("/certifications/{cert_id}/labs")
async def get_labs(cert_id: str, request: Request):
    labs = await db.labs.find({"cert_id": cert_id}, {"_id": 0, "instructions": 0}).to_list(100)
    
    user = await get_current_user(request)
    if user:
        progress = await db.user_progress.find_one(
            {"user_id": user["user_id"], "cert_id": cert_id},
            {"_id": 0}
        )
        completed_labs = progress.get("labs_completed", []) if progress else []
        for lab in labs:
            lab["status"] = "completed" if lab["lab_id"] in completed_labs else "not_started"
    
    return labs

@api_router.get("/labs/{lab_id}")
async def get_lab(lab_id: str):
    lab = await db.labs.find_one({"lab_id": lab_id}, {"_id": 0})
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    return lab

@api_router.post("/labs/complete")
async def complete_lab(data: LabCompletionRequest, user: Dict = Depends(require_auth)):
    progress = await db.user_progress.find_one(
        {"user_id": user["user_id"], "cert_id": data.cert_id},
        {"_id": 0}
    )
    
    if not progress:
        progress = {
            "progress_id": f"prog_{uuid.uuid4().hex[:12]}",
            "user_id": user["user_id"],
            "cert_id": data.cert_id,
            "labs_completed": [],
            "assessments_completed": [],
            "projects_completed": [],
            "domain_scores": {},
            "readiness_percentage": 0,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.user_progress.insert_one(progress)
    
    if data.lab_id not in progress.get("labs_completed", []):
        await db.user_progress.update_one(
            {"user_id": user["user_id"], "cert_id": data.cert_id},
            {
                "$push": {"labs_completed": data.lab_id},
                "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
            }
        )
    
    # Recalculate readiness
    await recalculate_readiness(user["user_id"], data.cert_id)
    
    updated_progress = await db.user_progress.find_one(
        {"user_id": user["user_id"], "cert_id": data.cert_id},
        {"_id": 0}
    )
    return updated_progress

# ============== ASSESSMENTS ROUTES ==============

@api_router.get("/certifications/{cert_id}/assessments")
async def get_assessments(cert_id: str, request: Request):
    assessments = await db.assessments.find(
        {"cert_id": cert_id},
        {"_id": 0, "questions": 0}
    ).to_list(100)
    
    user = await get_current_user(request)
    if user:
        progress = await db.user_progress.find_one(
            {"user_id": user["user_id"], "cert_id": cert_id},
            {"_id": 0}
        )
        completed_ids = [a["assessment_id"] for a in progress.get("assessments_completed", [])] if progress else []
        for assessment in assessments:
            assessment["status"] = "completed" if assessment["assessment_id"] in completed_ids else "not_started"
    
    return assessments

@api_router.get("/assessments/{assessment_id}")
async def get_assessment(assessment_id: str):
    assessment = await db.assessments.find_one({"assessment_id": assessment_id}, {"_id": 0})
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return assessment

@api_router.post("/assessments/submit")
async def submit_assessment(data: AssessmentSubmission, user: Dict = Depends(require_auth)):
    assessment = await db.assessments.find_one({"assessment_id": data.assessment_id}, {"_id": 0})
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    # Calculate score
    correct = 0
    total = len(assessment["questions"])
    weak_areas = []
    
    for q in assessment["questions"]:
        q_id = q["id"]
        if data.answers.get(q_id) == q["correct_answer"]:
            correct += 1
        else:
            weak_areas.append(q.get("topic", "General"))
    
    score = int((correct / total) * 100) if total > 0 else 0
    passed = score >= assessment["pass_threshold"]
    
    # Update progress
    result = {
        "assessment_id": data.assessment_id,
        "score": score,
        "passed": passed,
        "weak_areas": list(set(weak_areas)),
        "answers": data.answers,
        "completed_at": datetime.now(timezone.utc).isoformat()
    }
    
    progress = await db.user_progress.find_one(
        {"user_id": user["user_id"], "cert_id": data.cert_id},
        {"_id": 0}
    )
    
    if not progress:
        progress = {
            "progress_id": f"prog_{uuid.uuid4().hex[:12]}",
            "user_id": user["user_id"],
            "cert_id": data.cert_id,
            "labs_completed": [],
            "assessments_completed": [],
            "projects_completed": [],
            "domain_scores": {},
            "readiness_percentage": 0,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.user_progress.insert_one(progress)
    
    # Remove old result if exists and add new
    await db.user_progress.update_one(
        {"user_id": user["user_id"], "cert_id": data.cert_id},
        {"$pull": {"assessments_completed": {"assessment_id": data.assessment_id}}}
    )
    await db.user_progress.update_one(
        {"user_id": user["user_id"], "cert_id": data.cert_id},
        {
            "$push": {"assessments_completed": result},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    await recalculate_readiness(user["user_id"], data.cert_id)
    
    return {
        "score": score,
        "passed": passed,
        "correct": correct,
        "total": total,
        "weak_areas": list(set(weak_areas)),
        "pass_threshold": assessment["pass_threshold"]
    }

# ============== PROJECTS ROUTES ==============

@api_router.get("/certifications/{cert_id}/projects")
async def get_projects(cert_id: str, request: Request):
    projects = await db.projects.find(
        {"cert_id": cert_id},
        {"_id": 0, "tasks": 0}
    ).to_list(100)
    
    user = await get_current_user(request)
    if user:
        progress = await db.user_progress.find_one(
            {"user_id": user["user_id"], "cert_id": cert_id},
            {"_id": 0}
        )
        completed_ids = progress.get("projects_completed", []) if progress else []
        for project in projects:
            project["status"] = "completed" if project["project_id"] in completed_ids else "not_started"
    
    return projects

@api_router.get("/projects/{project_id}")
async def get_project(project_id: str):
    project = await db.projects.find_one({"project_id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@api_router.post("/projects/complete")
async def complete_project(data: ProjectCompletionRequest, user: Dict = Depends(require_auth)):
    progress = await db.user_progress.find_one(
        {"user_id": user["user_id"], "cert_id": data.cert_id},
        {"_id": 0}
    )
    
    if not progress:
        progress = {
            "progress_id": f"prog_{uuid.uuid4().hex[:12]}",
            "user_id": user["user_id"],
            "cert_id": data.cert_id,
            "labs_completed": [],
            "assessments_completed": [],
            "projects_completed": [],
            "domain_scores": {},
            "readiness_percentage": 0,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.user_progress.insert_one(progress)
    
    if data.project_id not in progress.get("projects_completed", []):
        await db.user_progress.update_one(
            {"user_id": user["user_id"], "cert_id": data.cert_id},
            {
                "$push": {"projects_completed": data.project_id},
                "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
            }
        )
    
    await recalculate_readiness(user["user_id"], data.cert_id)
    
    updated_progress = await db.user_progress.find_one(
        {"user_id": user["user_id"], "cert_id": data.cert_id},
        {"_id": 0}
    )
    return updated_progress

# ============== DASHBOARD ROUTES ==============

@api_router.get("/dashboard")
async def get_dashboard(user: Dict = Depends(require_auth)):
    progress_list = await db.user_progress.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).to_list(100)
    
    cert_ids = [p["cert_id"] for p in progress_list]
    certifications = await db.certifications.find(
        {"cert_id": {"$in": cert_ids}},
        {"_id": 0}
    ).to_list(100)
    
    cert_map = {c["cert_id"]: c for c in certifications}
    
    dashboard_data = []
    for p in progress_list:
        cert = cert_map.get(p["cert_id"], {})
        dashboard_data.append({
            "cert_id": p["cert_id"],
            "cert_name": cert.get("name", "Unknown"),
            "vendor": cert.get("vendor", ""),
            "readiness_percentage": p.get("readiness_percentage", 0),
            "labs_completed": len(p.get("labs_completed", [])),
            "labs_total": cert.get("labs_count", 0),
            "assessments_passed": len([a for a in p.get("assessments_completed", []) if a.get("passed")]),
            "assessments_total": cert.get("assessments_count", 0),
            "projects_completed": len(p.get("projects_completed", [])),
            "projects_total": cert.get("projects_count", 0),
            "domain_scores": p.get("domain_scores", {})
        })
    
    total_labs = sum(d["labs_completed"] for d in dashboard_data)
    total_assessments = sum(d["assessments_passed"] for d in dashboard_data)
    total_projects = sum(d["projects_completed"] for d in dashboard_data)
    
    return {
        "user": user,
        "certifications": dashboard_data,
        "stats": {
            "total_labs_completed": total_labs,
            "total_assessments_passed": total_assessments,
            "total_projects_completed": total_projects,
            "certifications_in_progress": len(dashboard_data)
        }
    }

@api_router.get("/progress/{cert_id}")
async def get_progress(cert_id: str, user: Dict = Depends(require_auth)):
    progress = await db.user_progress.find_one(
        {"user_id": user["user_id"], "cert_id": cert_id},
        {"_id": 0}
    )
    if not progress:
        return {
            "cert_id": cert_id,
            "labs_completed": [],
            "assessments_completed": [],
            "projects_completed": [],
            "domain_scores": {},
            "readiness_percentage": 0
        }
    return progress

# ============== PAYMENT ROUTES ==============

SUBSCRIPTION_PLANS = {
    "monthly": 29.99,
    "yearly": 199.99
}

@api_router.post("/checkout/create")
async def create_checkout(data: CheckoutRequest, request: Request, user: Dict = Depends(require_auth)):
    if data.plan not in SUBSCRIPTION_PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    amount = SUBSCRIPTION_PLANS[data.plan]
    
    host_url = data.origin_url
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    success_url = f"{host_url}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{host_url}/checkout"
    
    checkout_request = CheckoutSessionRequest(
        amount=amount,
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": user["user_id"],
            "plan": data.plan
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    await db.payment_transactions.insert_one({
        "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "session_id": session.session_id,
        "amount": amount,
        "currency": "usd",
        "plan": data.plan,
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/checkout/status/{session_id}")
async def check_payment_status(session_id: str, user: Dict = Depends(require_auth)):
    host_url = str(os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001'))
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    status = await stripe_checkout.get_checkout_status(session_id)
    
    # Update transaction
    transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    
    if transaction and transaction.get("payment_status") != "paid" and status.payment_status == "paid":
        # Update transaction status
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {
                "payment_status": status.payment_status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Update user subscription
        plan = transaction.get("plan", "monthly")
        days = 365 if plan == "yearly" else 30
        expires_at = datetime.now(timezone.utc) + timedelta(days=days)
        
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {"$set": {
                "subscription_status": "premium",
                "subscription_expires_at": expires_at.isoformat()
            }}
        )
    
    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    # Webhook handling for Stripe events
    body = await request.body()
    logger.info("Received Stripe webhook")
    return {"received": True}

# ============== HELPER FUNCTIONS ==============

async def recalculate_readiness(user_id: str, cert_id: str):
    progress = await db.user_progress.find_one(
        {"user_id": user_id, "cert_id": cert_id},
        {"_id": 0}
    )
    if not progress:
        return
    
    cert = await db.certifications.find_one({"cert_id": cert_id}, {"_id": 0})
    if not cert:
        return
    
    labs_weight = 0.4
    assessments_weight = 0.4
    projects_weight = 0.2
    
    labs_score = (len(progress.get("labs_completed", [])) / max(cert.get("labs_count", 1), 1)) * 100
    
    assessments_completed = progress.get("assessments_completed", [])
    passed_assessments = [a for a in assessments_completed if a.get("passed")]
    assessments_score = (len(passed_assessments) / max(cert.get("assessments_count", 1), 1)) * 100
    
    projects_score = (len(progress.get("projects_completed", [])) / max(cert.get("projects_count", 1), 1)) * 100
    
    readiness = int(
        labs_score * labs_weight +
        assessments_score * assessments_weight +
        projects_score * projects_weight
    )
    
    readiness = min(100, readiness)
    
    await db.user_progress.update_one(
        {"user_id": user_id, "cert_id": cert_id},
        {"$set": {"readiness_percentage": readiness}}
    )

# ============== SEED DATA ==============

@api_router.post("/seed")
async def seed_data():
    """Seed the database with sample certifications, labs, assessments, and projects"""
    
    # Check if already seeded
    existing = await db.certifications.find_one({})
    if existing:
        return {"message": "Data already seeded"}
    
    certifications = [
        {
            "cert_id": "aws-saa-c03",
            "vendor": "AWS",
            "name": "Solutions Architect Associate",
            "code": "SAA-C03",
            "difficulty": "Intermediate",
            "description": "Validate your ability to design and implement distributed systems on AWS. This certification demonstrates your expertise in designing highly available, cost-efficient, fault-tolerant systems.",
            "job_roles": ["Solutions Architect", "Cloud Engineer", "DevOps Engineer"],
            "exam_domains": [
                {"name": "Design Secure Architectures", "weight": 30},
                {"name": "Design Resilient Architectures", "weight": 26},
                {"name": "Design High-Performing Architectures", "weight": 24},
                {"name": "Design Cost-Optimized Architectures", "weight": 20}
            ],
            "labs_count": 5,
            "assessments_count": 3,
            "projects_count": 2,
            "image_url": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400"
        },
        {
            "cert_id": "aws-dev-c02",
            "vendor": "AWS",
            "name": "Developer Associate",
            "code": "DVA-C02",
            "difficulty": "Intermediate",
            "description": "Demonstrate your proficiency in developing and maintaining AWS-based applications. Learn to use core AWS services, AWS CLI, and SDKs to write applications.",
            "job_roles": ["Cloud Developer", "Software Engineer", "Backend Developer"],
            "exam_domains": [
                {"name": "Development with AWS Services", "weight": 32},
                {"name": "Security", "weight": 26},
                {"name": "Deployment", "weight": 24},
                {"name": "Troubleshooting & Optimization", "weight": 18}
            ],
            "labs_count": 4,
            "assessments_count": 3,
            "projects_count": 2,
            "image_url": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400"
        },
        {
            "cert_id": "az-900",
            "vendor": "Azure",
            "name": "Azure Fundamentals",
            "code": "AZ-900",
            "difficulty": "Beginner",
            "description": "Demonstrate foundational knowledge of cloud concepts and Azure services. Perfect entry point for anyone new to cloud computing.",
            "job_roles": ["Cloud Administrator", "IT Professional", "Business Analyst"],
            "exam_domains": [
                {"name": "Cloud Concepts", "weight": 25},
                {"name": "Azure Architecture", "weight": 35},
                {"name": "Azure Management & Governance", "weight": 30},
                {"name": "Azure Pricing & Support", "weight": 10}
            ],
            "labs_count": 4,
            "assessments_count": 2,
            "projects_count": 1,
            "image_url": "https://images.unsplash.com/photo-1526498460520-4c246339dccb?w=400"
        },
        {
            "cert_id": "az-104",
            "vendor": "Azure",
            "name": "Azure Administrator",
            "code": "AZ-104",
            "difficulty": "Intermediate",
            "description": "Master Azure administration including identity, governance, storage, compute, and virtual networks. Become proficient in managing Azure resources.",
            "job_roles": ["Azure Administrator", "Cloud Administrator", "Systems Administrator"],
            "exam_domains": [
                {"name": "Manage Azure Identities", "weight": 20},
                {"name": "Implement & Manage Storage", "weight": 15},
                {"name": "Deploy & Manage Compute", "weight": 20},
                {"name": "Configure Virtual Networking", "weight": 25},
                {"name": "Monitor & Backup Resources", "weight": 20}
            ],
            "labs_count": 5,
            "assessments_count": 3,
            "projects_count": 2,
            "image_url": "https://images.unsplash.com/photo-1535191042502-e6a9a3d407e7?w=400"
        },
        {
            "cert_id": "gcp-ace",
            "vendor": "GCP",
            "name": "Associate Cloud Engineer",
            "code": "ACE",
            "difficulty": "Intermediate",
            "description": "Deploy applications, monitor operations, and manage enterprise solutions on Google Cloud Platform. Learn to leverage GCP services effectively.",
            "job_roles": ["Cloud Engineer", "DevOps Engineer", "Site Reliability Engineer"],
            "exam_domains": [
                {"name": "Setting Up Cloud Solutions", "weight": 20},
                {"name": "Planning & Configuring", "weight": 20},
                {"name": "Deploying & Implementing", "weight": 25},
                {"name": "Ensuring Successful Operations", "weight": 20},
                {"name": "Configuring Access & Security", "weight": 15}
            ],
            "labs_count": 4,
            "assessments_count": 3,
            "projects_count": 2,
            "image_url": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400"
        },
        {
            "cert_id": "devops-pro",
            "vendor": "DevOps",
            "name": "DevOps Professional",
            "code": "DOP-PRO",
            "difficulty": "Advanced",
            "description": "Master CI/CD pipelines, infrastructure as code, monitoring, and DevOps best practices. Build and operate highly scalable systems.",
            "job_roles": ["DevOps Engineer", "Platform Engineer", "SRE"],
            "exam_domains": [
                {"name": "CI/CD Pipelines", "weight": 30},
                {"name": "Infrastructure as Code", "weight": 25},
                {"name": "Monitoring & Logging", "weight": 20},
                {"name": "Security & Compliance", "weight": 15},
                {"name": "Incident Management", "weight": 10}
            ],
            "labs_count": 5,
            "assessments_count": 3,
            "projects_count": 3,
            "image_url": "https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=400"
        }
    ]
    
    await db.certifications.insert_many(certifications)
    
    # Seed Labs
    labs = [
        # AWS SAA Labs
        {
            "lab_id": "lab-aws-saa-1",
            "cert_id": "aws-saa-c03",
            "title": "Deploy a Multi-Tier Web Application",
            "description": "Learn to deploy a highly available web application using EC2, ALB, and RDS across multiple availability zones.",
            "skill_trained": "High Availability Architecture",
            "exam_domain": "Design Resilient Architectures",
            "duration_minutes": 45,
            "difficulty": "Intermediate",
            "prerequisites": ["Basic AWS knowledge", "Understanding of networking"],
            "instructions": [
                {"step": 1, "title": "Create VPC", "content": "Create a VPC with public and private subnets across two AZs", "check": "VPC created with 4 subnets"},
                {"step": 2, "title": "Launch EC2 Instances", "content": "Deploy EC2 instances in private subnets with Auto Scaling", "check": "ASG configured with min 2 instances"},
                {"step": 3, "title": "Configure ALB", "content": "Set up Application Load Balancer in public subnets", "check": "ALB healthy and routing traffic"},
                {"step": 4, "title": "Deploy RDS", "content": "Create Multi-AZ RDS MySQL instance", "check": "RDS running with Multi-AZ enabled"},
                {"step": 5, "title": "Test Failover", "content": "Simulate instance failure and verify recovery", "check": "Application remains available"}
            ]
        },
        {
            "lab_id": "lab-aws-saa-2",
            "cert_id": "aws-saa-c03",
            "title": "Implement Serverless API with Lambda",
            "description": "Build a serverless REST API using API Gateway, Lambda, and DynamoDB.",
            "skill_trained": "Serverless Architecture",
            "exam_domain": "Design High-Performing Architectures",
            "duration_minutes": 40,
            "difficulty": "Intermediate",
            "prerequisites": ["Python basics", "REST API concepts"],
            "instructions": [
                {"step": 1, "title": "Create DynamoDB Table", "content": "Create a DynamoDB table for storing items", "check": "Table created with proper schema"},
                {"step": 2, "title": "Write Lambda Function", "content": "Create Lambda function for CRUD operations", "check": "Lambda deployed and tested"},
                {"step": 3, "title": "Configure API Gateway", "content": "Set up REST API with proper methods", "check": "API Gateway configured"},
                {"step": 4, "title": "Test API", "content": "Test all CRUD operations via API", "check": "All endpoints working"}
            ]
        },
        {
            "lab_id": "lab-aws-saa-3",
            "cert_id": "aws-saa-c03",
            "title": "S3 Security and Encryption",
            "description": "Implement S3 bucket policies, encryption, and access logging for secure data storage.",
            "skill_trained": "Data Security",
            "exam_domain": "Design Secure Architectures",
            "duration_minutes": 30,
            "difficulty": "Beginner",
            "prerequisites": ["S3 basics"],
            "instructions": [
                {"step": 1, "title": "Create S3 Bucket", "content": "Create bucket with versioning enabled", "check": "Bucket created"},
                {"step": 2, "title": "Enable Encryption", "content": "Configure SSE-S3 default encryption", "check": "Encryption enabled"},
                {"step": 3, "title": "Set Bucket Policy", "content": "Create policy requiring HTTPS", "check": "Policy applied"},
                {"step": 4, "title": "Enable Logging", "content": "Configure access logging", "check": "Logging configured"}
            ]
        },
        {
            "lab_id": "lab-aws-saa-4",
            "cert_id": "aws-saa-c03",
            "title": "Cost Optimization with Reserved Instances",
            "description": "Learn to analyze EC2 usage and implement cost-saving strategies.",
            "skill_trained": "Cost Optimization",
            "exam_domain": "Design Cost-Optimized Architectures",
            "duration_minutes": 35,
            "difficulty": "Intermediate",
            "prerequisites": ["EC2 knowledge"],
            "instructions": [
                {"step": 1, "title": "Analyze Usage", "content": "Use Cost Explorer to analyze EC2 usage", "check": "Usage report generated"},
                {"step": 2, "title": "Identify Candidates", "content": "Find instances suitable for reservations", "check": "Candidates identified"},
                {"step": 3, "title": "Calculate Savings", "content": "Compare On-Demand vs Reserved pricing", "check": "Savings calculated"},
                {"step": 4, "title": "Plan Implementation", "content": "Create reservation strategy", "check": "Strategy documented"}
            ]
        },
        {
            "lab_id": "lab-aws-saa-5",
            "cert_id": "aws-saa-c03",
            "title": "CloudFront CDN Distribution",
            "description": "Set up CloudFront distribution for global content delivery with S3 origin.",
            "skill_trained": "Content Delivery",
            "exam_domain": "Design High-Performing Architectures",
            "duration_minutes": 35,
            "difficulty": "Intermediate",
            "prerequisites": ["S3 knowledge", "DNS basics"],
            "instructions": [
                {"step": 1, "title": "Prepare S3 Origin", "content": "Configure S3 bucket as origin", "check": "S3 configured"},
                {"step": 2, "title": "Create Distribution", "content": "Create CloudFront distribution", "check": "Distribution created"},
                {"step": 3, "title": "Configure Caching", "content": "Set up cache behaviors", "check": "Caching configured"},
                {"step": 4, "title": "Test Delivery", "content": "Verify content delivery from edge", "check": "Content delivered"}
            ]
        },
        # Azure AZ-900 Labs
        {
            "lab_id": "lab-az-900-1",
            "cert_id": "az-900",
            "title": "Create Your First Virtual Machine",
            "description": "Deploy a Windows virtual machine in Azure and connect via RDP.",
            "skill_trained": "Azure Compute",
            "exam_domain": "Azure Architecture",
            "duration_minutes": 25,
            "difficulty": "Beginner",
            "prerequisites": [],
            "instructions": [
                {"step": 1, "title": "Navigate to Portal", "content": "Go to Azure Portal and VM service", "check": "Portal accessed"},
                {"step": 2, "title": "Create VM", "content": "Create Windows Server VM", "check": "VM deployed"},
                {"step": 3, "title": "Configure NSG", "content": "Allow RDP access", "check": "NSG configured"},
                {"step": 4, "title": "Connect", "content": "Connect via RDP", "check": "Connection successful"}
            ]
        },
        {
            "lab_id": "lab-az-900-2",
            "cert_id": "az-900",
            "title": "Azure Storage Account Basics",
            "description": "Create and configure an Azure Storage Account with Blob storage.",
            "skill_trained": "Azure Storage",
            "exam_domain": "Azure Architecture",
            "duration_minutes": 20,
            "difficulty": "Beginner",
            "prerequisites": [],
            "instructions": [
                {"step": 1, "title": "Create Storage Account", "content": "Create new storage account", "check": "Account created"},
                {"step": 2, "title": "Create Container", "content": "Create blob container", "check": "Container created"},
                {"step": 3, "title": "Upload Blob", "content": "Upload a file as blob", "check": "Blob uploaded"},
                {"step": 4, "title": "Access Blob", "content": "Generate SAS and access blob", "check": "Blob accessible"}
            ]
        },
        {
            "lab_id": "lab-az-900-3",
            "cert_id": "az-900",
            "title": "Resource Groups and Tags",
            "description": "Learn to organize Azure resources using resource groups and tags.",
            "skill_trained": "Azure Management",
            "exam_domain": "Azure Management & Governance",
            "duration_minutes": 20,
            "difficulty": "Beginner",
            "prerequisites": [],
            "instructions": [
                {"step": 1, "title": "Create Resource Group", "content": "Create new resource group", "check": "RG created"},
                {"step": 2, "title": "Add Resources", "content": "Create resources in the group", "check": "Resources added"},
                {"step": 3, "title": "Apply Tags", "content": "Tag resources for cost tracking", "check": "Tags applied"},
                {"step": 4, "title": "View Costs", "content": "Check cost analysis by tags", "check": "Costs visible"}
            ]
        },
        {
            "lab_id": "lab-az-900-4",
            "cert_id": "az-900",
            "title": "Azure Active Directory Basics",
            "description": "Create users and groups in Azure Active Directory.",
            "skill_trained": "Identity Management",
            "exam_domain": "Azure Architecture",
            "duration_minutes": 25,
            "difficulty": "Beginner",
            "prerequisites": [],
            "instructions": [
                {"step": 1, "title": "Access Azure AD", "content": "Navigate to Azure AD", "check": "AD accessed"},
                {"step": 2, "title": "Create User", "content": "Create a new user account", "check": "User created"},
                {"step": 3, "title": "Create Group", "content": "Create security group", "check": "Group created"},
                {"step": 4, "title": "Assign Roles", "content": "Assign roles to group", "check": "Roles assigned"}
            ]
        },
        # GCP Labs
        {
            "lab_id": "lab-gcp-ace-1",
            "cert_id": "gcp-ace",
            "title": "Deploy App to Compute Engine",
            "description": "Deploy a web application to Google Compute Engine with load balancing.",
            "skill_trained": "GCP Compute",
            "exam_domain": "Deploying & Implementing",
            "duration_minutes": 40,
            "difficulty": "Intermediate",
            "prerequisites": ["GCP basics"],
            "instructions": [
                {"step": 1, "title": "Create Instance", "content": "Create Compute Engine VM", "check": "VM running"},
                {"step": 2, "title": "Deploy App", "content": "Deploy web application", "check": "App deployed"},
                {"step": 3, "title": "Configure LB", "content": "Set up HTTP load balancer", "check": "LB configured"},
                {"step": 4, "title": "Test Access", "content": "Access app via LB", "check": "App accessible"}
            ]
        },
        {
            "lab_id": "lab-gcp-ace-2",
            "cert_id": "gcp-ace",
            "title": "Cloud Storage and IAM",
            "description": "Create Cloud Storage buckets and configure IAM permissions.",
            "skill_trained": "GCP Storage & Security",
            "exam_domain": "Configuring Access & Security",
            "duration_minutes": 30,
            "difficulty": "Beginner",
            "prerequisites": [],
            "instructions": [
                {"step": 1, "title": "Create Bucket", "content": "Create Cloud Storage bucket", "check": "Bucket created"},
                {"step": 2, "title": "Upload Objects", "content": "Upload files to bucket", "check": "Files uploaded"},
                {"step": 3, "title": "Configure IAM", "content": "Set bucket-level IAM", "check": "IAM configured"},
                {"step": 4, "title": "Test Access", "content": "Verify access controls", "check": "Access verified"}
            ]
        },
        {
            "lab_id": "lab-gcp-ace-3",
            "cert_id": "gcp-ace",
            "title": "Kubernetes on GKE",
            "description": "Deploy a containerized application on Google Kubernetes Engine.",
            "skill_trained": "Container Orchestration",
            "exam_domain": "Deploying & Implementing",
            "duration_minutes": 45,
            "difficulty": "Intermediate",
            "prerequisites": ["Docker basics", "Kubernetes concepts"],
            "instructions": [
                {"step": 1, "title": "Create Cluster", "content": "Create GKE cluster", "check": "Cluster running"},
                {"step": 2, "title": "Deploy App", "content": "Deploy containerized app", "check": "Pods running"},
                {"step": 3, "title": "Expose Service", "content": "Create LoadBalancer service", "check": "Service exposed"},
                {"step": 4, "title": "Scale App", "content": "Scale deployment", "check": "Scaling works"}
            ]
        },
        {
            "lab_id": "lab-gcp-ace-4",
            "cert_id": "gcp-ace",
            "title": "Cloud Functions Serverless",
            "description": "Create and deploy serverless functions with Cloud Functions.",
            "skill_trained": "Serverless Computing",
            "exam_domain": "Deploying & Implementing",
            "duration_minutes": 30,
            "difficulty": "Beginner",
            "prerequisites": ["Python or Node.js basics"],
            "instructions": [
                {"step": 1, "title": "Create Function", "content": "Write Cloud Function code", "check": "Code ready"},
                {"step": 2, "title": "Deploy", "content": "Deploy function", "check": "Function deployed"},
                {"step": 3, "title": "Configure Trigger", "content": "Set HTTP trigger", "check": "Trigger configured"},
                {"step": 4, "title": "Test", "content": "Invoke function", "check": "Function works"}
            ]
        }
    ]
    
    await db.labs.insert_many(labs)
    
    # Seed Assessments
    assessments = [
        # AWS SAA Assessments
        {
            "assessment_id": "assess-aws-saa-1",
            "cert_id": "aws-saa-c03",
            "title": "Secure Architectures Domain Test",
            "description": "Test your knowledge of designing secure AWS architectures.",
            "type": "domain",
            "topics": ["IAM", "VPC Security", "Encryption", "Security Groups"],
            "time_minutes": 30,
            "pass_threshold": 70,
            "questions": [
                {"id": "q1", "topic": "IAM", "question": "Which IAM entity should you use to grant temporary access to AWS resources?", "options": ["IAM User", "IAM Role", "IAM Group", "IAM Policy"], "correct_answer": "IAM Role"},
                {"id": "q2", "topic": "VPC Security", "question": "Which AWS service provides a managed firewall for your VPC?", "options": ["Security Groups", "NACLs", "AWS WAF", "AWS Network Firewall"], "correct_answer": "AWS Network Firewall"},
                {"id": "q3", "topic": "Encryption", "question": "What type of encryption does S3 SSE-S3 use?", "options": ["AES-128", "AES-256", "RSA-2048", "DES"], "correct_answer": "AES-256"},
                {"id": "q4", "topic": "Security Groups", "question": "Security Groups are:", "options": ["Stateless", "Stateful", "Applied at subnet level", "Default deny outbound"], "correct_answer": "Stateful"},
                {"id": "q5", "topic": "IAM", "question": "What is the principle of least privilege?", "options": ["Grant all permissions", "Grant minimum required permissions", "Use root account", "Share credentials"], "correct_answer": "Grant minimum required permissions"}
            ]
        },
        {
            "assessment_id": "assess-aws-saa-2",
            "cert_id": "aws-saa-c03",
            "title": "High Availability Domain Test",
            "description": "Test your understanding of resilient and highly available architectures.",
            "type": "domain",
            "topics": ["Multi-AZ", "Auto Scaling", "Load Balancing", "Disaster Recovery"],
            "time_minutes": 30,
            "pass_threshold": 70,
            "questions": [
                {"id": "q1", "topic": "Multi-AZ", "question": "Multi-AZ RDS provides:", "options": ["Read replicas", "Synchronous replication", "Asynchronous replication", "Manual failover"], "correct_answer": "Synchronous replication"},
                {"id": "q2", "topic": "Auto Scaling", "question": "What triggers Auto Scaling?", "options": ["Manual intervention only", "CloudWatch alarms", "User requests", "Database load"], "correct_answer": "CloudWatch alarms"},
                {"id": "q3", "topic": "Load Balancing", "question": "Which load balancer operates at Layer 7?", "options": ["NLB", "CLB", "ALB", "GLB"], "correct_answer": "ALB"},
                {"id": "q4", "topic": "Disaster Recovery", "question": "Which DR strategy has the lowest RTO?", "options": ["Backup & Restore", "Pilot Light", "Warm Standby", "Multi-Site Active/Active"], "correct_answer": "Multi-Site Active/Active"},
                {"id": "q5", "topic": "Multi-AZ", "question": "S3 stores data across how many AZs minimum?", "options": ["1", "2", "3", "4"], "correct_answer": "3"}
            ]
        },
        {
            "assessment_id": "assess-aws-saa-3",
            "cert_id": "aws-saa-c03",
            "title": "Full Practice Exam",
            "description": "Complete practice exam covering all SAA-C03 domains.",
            "type": "full_exam",
            "topics": ["All Domains"],
            "time_minutes": 90,
            "pass_threshold": 72,
            "questions": [
                {"id": "q1", "topic": "Compute", "question": "Which EC2 instance type is best for memory-intensive workloads?", "options": ["C5", "R5", "T3", "M5"], "correct_answer": "R5"},
                {"id": "q2", "topic": "Storage", "question": "Which EBS volume type offers the highest IOPS?", "options": ["gp2", "gp3", "io1", "st1"], "correct_answer": "io1"},
                {"id": "q3", "topic": "Networking", "question": "What is the maximum size of a VPC CIDR block?", "options": ["/16", "/20", "/24", "/28"], "correct_answer": "/16"},
                {"id": "q4", "topic": "Security", "question": "KMS keys can be rotated:", "options": ["Never", "Manually only", "Automatically annually", "Daily"], "correct_answer": "Automatically annually"},
                {"id": "q5", "topic": "Database", "question": "Aurora can have up to how many read replicas?", "options": ["5", "10", "15", "20"], "correct_answer": "15"},
                {"id": "q6", "topic": "Serverless", "question": "What is the maximum Lambda timeout?", "options": ["5 minutes", "10 minutes", "15 minutes", "30 minutes"], "correct_answer": "15 minutes"},
                {"id": "q7", "topic": "Cost", "question": "Which pricing model offers the highest discount?", "options": ["On-Demand", "Spot", "Reserved 1-year", "Reserved 3-year"], "correct_answer": "Reserved 3-year"},
                {"id": "q8", "topic": "Architecture", "question": "Which service decouples application components?", "options": ["EC2", "SQS", "S3", "RDS"], "correct_answer": "SQS"}
            ]
        },
        # Azure AZ-900 Assessments
        {
            "assessment_id": "assess-az-900-1",
            "cert_id": "az-900",
            "title": "Cloud Concepts Test",
            "description": "Test your understanding of fundamental cloud concepts.",
            "type": "domain",
            "topics": ["Cloud Models", "Benefits", "Service Types"],
            "time_minutes": 20,
            "pass_threshold": 65,
            "questions": [
                {"id": "q1", "topic": "Cloud Models", "question": "Which cloud model offers the most control?", "options": ["Public", "Private", "Hybrid", "Multi-cloud"], "correct_answer": "Private"},
                {"id": "q2", "topic": "Benefits", "question": "What does 'elasticity' mean in cloud?", "options": ["Fixed resources", "Auto-scaling resources", "Manual scaling", "No scaling"], "correct_answer": "Auto-scaling resources"},
                {"id": "q3", "topic": "Service Types", "question": "Azure VMs are an example of:", "options": ["SaaS", "PaaS", "IaaS", "FaaS"], "correct_answer": "IaaS"},
                {"id": "q4", "topic": "Benefits", "question": "CapEx refers to:", "options": ["Monthly bills", "Upfront investment", "Pay-per-use", "Free tier"], "correct_answer": "Upfront investment"},
                {"id": "q5", "topic": "Cloud Models", "question": "Multi-tenant architecture is typical of:", "options": ["Private cloud", "Public cloud", "On-premises", "Hybrid"], "correct_answer": "Public cloud"}
            ]
        },
        {
            "assessment_id": "assess-az-900-2",
            "cert_id": "az-900",
            "title": "AZ-900 Practice Exam",
            "description": "Full practice exam for Azure Fundamentals.",
            "type": "full_exam",
            "topics": ["All Domains"],
            "time_minutes": 45,
            "pass_threshold": 70,
            "questions": [
                {"id": "q1", "topic": "Compute", "question": "Azure App Service is:", "options": ["IaaS", "PaaS", "SaaS", "FaaS"], "correct_answer": "PaaS"},
                {"id": "q2", "topic": "Storage", "question": "Blob Storage tier with lowest cost:", "options": ["Hot", "Cool", "Archive", "Premium"], "correct_answer": "Archive"},
                {"id": "q3", "topic": "Networking", "question": "Azure region contains:", "options": ["One datacenter", "Multiple datacenters", "One continent", "One country"], "correct_answer": "Multiple datacenters"},
                {"id": "q4", "topic": "Security", "question": "Azure AD is used for:", "options": ["Storage", "Identity", "Compute", "Networking"], "correct_answer": "Identity"},
                {"id": "q5", "topic": "Governance", "question": "Azure Policy is used to:", "options": ["Deploy VMs", "Enforce standards", "Monitor costs", "Create users"], "correct_answer": "Enforce standards"}
            ]
        },
        # GCP Assessments
        {
            "assessment_id": "assess-gcp-ace-1",
            "cert_id": "gcp-ace",
            "title": "GCP Compute Domain Test",
            "description": "Test your knowledge of GCP compute services.",
            "type": "domain",
            "topics": ["Compute Engine", "GKE", "App Engine", "Cloud Functions"],
            "time_minutes": 25,
            "pass_threshold": 70,
            "questions": [
                {"id": "q1", "topic": "Compute Engine", "question": "Preemptible VMs can run for max:", "options": ["12 hours", "24 hours", "48 hours", "Unlimited"], "correct_answer": "24 hours"},
                {"id": "q2", "topic": "GKE", "question": "GKE Autopilot manages:", "options": ["Only pods", "Nodes and pods", "Only nodes", "Nothing"], "correct_answer": "Nodes and pods"},
                {"id": "q3", "topic": "App Engine", "question": "App Engine Standard supports:", "options": ["Any runtime", "Specific runtimes only", "Only Python", "Only Java"], "correct_answer": "Specific runtimes only"},
                {"id": "q4", "topic": "Cloud Functions", "question": "Cloud Functions are:", "options": ["Always running", "Event-driven", "Manual trigger only", "Scheduled only"], "correct_answer": "Event-driven"},
                {"id": "q5", "topic": "Compute Engine", "question": "Custom machine types allow:", "options": ["Fixed vCPU/RAM", "Custom vCPU/RAM", "Only GPU", "Only storage"], "correct_answer": "Custom vCPU/RAM"}
            ]
        },
        {
            "assessment_id": "assess-gcp-ace-2",
            "cert_id": "gcp-ace",
            "title": "GCP Storage Domain Test",
            "description": "Test your understanding of GCP storage and database services.",
            "type": "domain",
            "topics": ["Cloud Storage", "Cloud SQL", "BigQuery", "Firestore"],
            "time_minutes": 25,
            "pass_threshold": 70,
            "questions": [
                {"id": "q1", "topic": "Cloud Storage", "question": "Nearline storage is best for:", "options": ["Frequent access", "Monthly access", "Yearly access", "Archive"], "correct_answer": "Monthly access"},
                {"id": "q2", "topic": "Cloud SQL", "question": "Cloud SQL supports:", "options": ["Only MySQL", "Only PostgreSQL", "MySQL, PostgreSQL, SQL Server", "MongoDB"], "correct_answer": "MySQL, PostgreSQL, SQL Server"},
                {"id": "q3", "topic": "BigQuery", "question": "BigQuery is:", "options": ["OLTP database", "Serverless data warehouse", "NoSQL database", "In-memory cache"], "correct_answer": "Serverless data warehouse"},
                {"id": "q4", "topic": "Firestore", "question": "Firestore is:", "options": ["Relational database", "Document database", "Key-value store", "Graph database"], "correct_answer": "Document database"},
                {"id": "q5", "topic": "Cloud Storage", "question": "Object versioning helps with:", "options": ["Performance", "Data protection", "Cost reduction", "Encryption"], "correct_answer": "Data protection"}
            ]
        },
        {
            "assessment_id": "assess-gcp-ace-3",
            "cert_id": "gcp-ace",
            "title": "GCP ACE Practice Exam",
            "description": "Full practice exam for Associate Cloud Engineer.",
            "type": "full_exam",
            "topics": ["All Domains"],
            "time_minutes": 60,
            "pass_threshold": 70,
            "questions": [
                {"id": "q1", "topic": "IAM", "question": "Service accounts are for:", "options": ["Human users", "Applications", "Groups", "Organizations"], "correct_answer": "Applications"},
                {"id": "q2", "topic": "Networking", "question": "VPC is:", "options": ["Regional", "Global", "Zonal", "Multi-regional"], "correct_answer": "Global"},
                {"id": "q3", "topic": "Compute", "question": "Managed instance groups provide:", "options": ["Manual scaling", "Auto-healing", "No redundancy", "Single zone"], "correct_answer": "Auto-healing"},
                {"id": "q4", "topic": "Storage", "question": "gsutil is used for:", "options": ["Compute Engine", "Cloud Storage", "Cloud SQL", "BigQuery"], "correct_answer": "Cloud Storage"},
                {"id": "q5", "topic": "Billing", "question": "Committed use discounts require:", "options": ["1 or 3 year commitment", "Monthly payment", "No commitment", "Daily usage"], "correct_answer": "1 or 3 year commitment"}
            ]
        }
    ]
    
    await db.assessments.insert_many(assessments)
    
    # Seed Projects
    projects = [
        # AWS SAA Projects
        {
            "project_id": "proj-aws-saa-1",
            "cert_id": "aws-saa-c03",
            "title": "E-Commerce Platform Migration",
            "description": "Migrate a legacy e-commerce application to AWS with high availability and scalability.",
            "business_scenario": "Your company runs an e-commerce platform on legacy infrastructure. You need to migrate it to AWS ensuring 99.9% uptime, auto-scaling during sales events, and disaster recovery.",
            "technologies": ["EC2", "RDS Multi-AZ", "ElastiCache", "S3", "CloudFront", "Route 53"],
            "difficulty": "Intermediate",
            "skills_validated": ["Migration Planning", "High Availability", "Cost Optimization", "Security"],
            "tasks": [
                {"id": 1, "title": "Design Architecture", "description": "Create architecture diagram for the migrated system"},
                {"id": 2, "title": "Set Up VPC", "description": "Configure VPC with proper subnets and security"},
                {"id": 3, "title": "Deploy Application Tier", "description": "Set up EC2 with Auto Scaling"},
                {"id": 4, "title": "Configure Database", "description": "Migrate to RDS Multi-AZ"},
                {"id": 5, "title": "Implement Caching", "description": "Add ElastiCache for session management"},
                {"id": 6, "title": "Set Up CDN", "description": "Configure CloudFront for static content"}
            ],
            "deliverables": ["Architecture diagram", "Working application", "DR runbook", "Cost estimate"]
        },
        {
            "project_id": "proj-aws-saa-2",
            "cert_id": "aws-saa-c03",
            "title": "Serverless Data Pipeline",
            "description": "Build a serverless data ingestion and processing pipeline.",
            "business_scenario": "Build a real-time data pipeline that ingests IoT sensor data, processes it, and provides analytics dashboards.",
            "technologies": ["Kinesis", "Lambda", "DynamoDB", "S3", "Athena", "QuickSight"],
            "difficulty": "Advanced",
            "skills_validated": ["Serverless Architecture", "Data Processing", "Analytics", "Event-Driven Design"],
            "tasks": [
                {"id": 1, "title": "Design Data Flow", "description": "Map out the complete data pipeline"},
                {"id": 2, "title": "Set Up Ingestion", "description": "Configure Kinesis for data ingestion"},
                {"id": 3, "title": "Create Processors", "description": "Build Lambda functions for data processing"},
                {"id": 4, "title": "Store Data", "description": "Configure DynamoDB and S3 for storage"},
                {"id": 5, "title": "Build Analytics", "description": "Set up Athena queries and QuickSight dashboard"}
            ],
            "deliverables": ["Data flow diagram", "Working pipeline", "Analytics dashboard", "Documentation"]
        },
        # Azure Projects
        {
            "project_id": "proj-az-900-1",
            "cert_id": "az-900",
            "title": "Simple Web App Deployment",
            "description": "Deploy a basic web application using Azure services.",
            "business_scenario": "Deploy a company website with a database backend that can scale based on traffic.",
            "technologies": ["App Service", "Azure SQL", "Blob Storage"],
            "difficulty": "Beginner",
            "skills_validated": ["Azure Portal", "PaaS Services", "Basic Security"],
            "tasks": [
                {"id": 1, "title": "Create App Service", "description": "Set up Azure App Service"},
                {"id": 2, "title": "Configure Database", "description": "Create Azure SQL database"},
                {"id": 3, "title": "Deploy Code", "description": "Deploy application code"},
                {"id": 4, "title": "Configure Storage", "description": "Set up Blob storage for files"}
            ],
            "deliverables": ["Working website", "Documentation"]
        },
        # GCP Projects
        {
            "project_id": "proj-gcp-ace-1",
            "cert_id": "gcp-ace",
            "title": "Microservices on GKE",
            "description": "Deploy a microservices application on Google Kubernetes Engine.",
            "business_scenario": "Containerize and deploy a microservices application with CI/CD pipeline.",
            "technologies": ["GKE", "Cloud Build", "Container Registry", "Cloud SQL"],
            "difficulty": "Intermediate",
            "skills_validated": ["Kubernetes", "CI/CD", "Container Management", "Networking"],
            "tasks": [
                {"id": 1, "title": "Create GKE Cluster", "description": "Set up production-ready GKE cluster"},
                {"id": 2, "title": "Containerize Services", "description": "Create Docker images for services"},
                {"id": 3, "title": "Deploy Services", "description": "Deploy services to GKE"},
                {"id": 4, "title": "Set Up CI/CD", "description": "Configure Cloud Build pipeline"},
                {"id": 5, "title": "Configure Networking", "description": "Set up ingress and service mesh"}
            ],
            "deliverables": ["Running application", "CI/CD pipeline", "Architecture documentation"]
        },
        {
            "project_id": "proj-gcp-ace-2",
            "cert_id": "gcp-ace",
            "title": "Data Analytics Platform",
            "description": "Build a data analytics platform using GCP services.",
            "business_scenario": "Create a platform for analyzing business data with real-time dashboards.",
            "technologies": ["BigQuery", "Dataflow", "Cloud Storage", "Data Studio"],
            "difficulty": "Intermediate",
            "skills_validated": ["Data Engineering", "BigQuery", "ETL Pipelines", "Visualization"],
            "tasks": [
                {"id": 1, "title": "Design Schema", "description": "Design BigQuery dataset schema"},
                {"id": 2, "title": "Build ETL", "description": "Create Dataflow pipeline"},
                {"id": 3, "title": "Load Data", "description": "Import and transform data"},
                {"id": 4, "title": "Create Dashboard", "description": "Build Data Studio dashboard"}
            ],
            "deliverables": ["BigQuery dataset", "ETL pipeline", "Dashboard", "Documentation"]
        }
    ]
    
    await db.projects.insert_many(projects)
    
    return {"message": "Data seeded successfully", "certifications": len(certifications), "labs": len(labs), "assessments": len(assessments), "projects": len(projects)}

# ============== ROOT ENDPOINT ==============

# ============== BOOKMARKS & NOTES ROUTES ==============

@api_router.get("/bookmarks")
async def get_bookmarks(user: Dict = Depends(require_auth)):
    bookmarks = await db.user_bookmarks.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).to_list(100)
    return bookmarks

@api_router.post("/bookmarks")
async def toggle_bookmark(data: BookmarkRequest, user: Dict = Depends(require_auth)):
    existing = await db.user_bookmarks.find_one(
        {"user_id": user["user_id"], "lab_id": data.lab_id},
        {"_id": 0}
    )
    
    if data.bookmarked:
        if not existing:
            await db.user_bookmarks.insert_one({
                "user_id": user["user_id"],
                "lab_id": data.lab_id,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        return {"bookmarked": True}
    else:
        if existing:
            await db.user_bookmarks.delete_one({"user_id": user["user_id"], "lab_id": data.lab_id})
        return {"bookmarked": False}

@api_router.get("/notes")
async def get_notes(user: Dict = Depends(require_auth)):
    notes = await db.user_notes.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).to_list(100)
    return notes

@api_router.get("/notes/{lab_id}")
async def get_note(lab_id: str, user: Dict = Depends(require_auth)):
    note = await db.user_notes.find_one(
        {"user_id": user["user_id"], "lab_id": lab_id},
        {"_id": 0}
    )
    return note or {"lab_id": lab_id, "content": ""}

@api_router.post("/notes")
async def save_note(data: NoteRequest, user: Dict = Depends(require_auth)):
    await db.user_notes.update_one(
        {"user_id": user["user_id"], "lab_id": data.lab_id},
        {
            "$set": {
                "content": data.content,
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            "$setOnInsert": {
                "user_id": user["user_id"],
                "lab_id": data.lab_id,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        },
        upsert=True
    )
    return {"success": True}

# ============== ASSESSMENT REVIEW ROUTES ==============

@api_router.get("/assessments/{assessment_id}/review")
async def get_assessment_review(assessment_id: str, user: Dict = Depends(require_auth)):
    """Get assessment with answers for review mode"""
    assessment = await db.assessments.find_one({"assessment_id": assessment_id}, {"_id": 0})
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    # Get user's submission for this assessment
    progress_list = await db.user_progress.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).to_list(100)
    
    user_submission = None
    for progress in progress_list:
        for completed in progress.get("assessments_completed", []):
            if completed.get("assessment_id") == assessment_id:
                user_submission = completed
                break
    
    # Add correct answers and user answers to each question
    questions_with_review = []
    for q in assessment.get("questions", []):
        q_copy = dict(q)
        q_copy["user_answer"] = user_submission.get("answers", {}).get(q["id"]) if user_submission else None
        q_copy["is_correct"] = q_copy["user_answer"] == q["correct_answer"] if q_copy["user_answer"] else False
        questions_with_review.append(q_copy)
    
    return {
        "assessment_id": assessment_id,
        "title": assessment.get("title"),
        "type": assessment.get("type"),
        "questions": questions_with_review,
        "user_score": user_submission.get("score") if user_submission else None,
        "passed": user_submission.get("passed") if user_submission else None
    }

# ============== CERTIFICATE ROUTES ==============

@api_router.get("/certificates")
async def get_certificates(user: Dict = Depends(require_auth)):
    """Get all earned certificates for the user"""
    certificates = await db.user_certificates.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).to_list(100)
    return certificates

@api_router.post("/certificates/generate")
async def generate_certificate(data: CertificateRequest, user: Dict = Depends(require_auth)):
    """Generate a certificate for a completed certification"""
    # Check if user has 80%+ readiness
    progress = await db.user_progress.find_one(
        {"user_id": user["user_id"], "cert_id": data.cert_id},
        {"_id": 0}
    )
    
    if not progress or progress.get("readiness_percentage", 0) < 80:
        raise HTTPException(status_code=400, detail="Need 80%+ readiness to earn certificate")
    
    # Get certification details
    cert = await db.certifications.find_one({"cert_id": data.cert_id}, {"_id": 0})
    if not cert:
        raise HTTPException(status_code=404, detail="Certification not found")
    
    # Check if certificate already exists
    existing = await db.user_certificates.find_one(
        {"user_id": user["user_id"], "cert_id": data.cert_id},
        {"_id": 0}
    )
    
    if existing:
        return existing
    
    # Generate certificate ID
    cert_number = f"ST365-{uuid.uuid4().hex[:8].upper()}"
    
    # Create certificate record
    certificate = {
        "certificate_id": cert_number,
        "user_id": user["user_id"],
        "user_name": user["name"],
        "user_email": user["email"],
        "cert_id": data.cert_id,
        "cert_name": cert["name"],
        "cert_code": cert["code"],
        "vendor": cert["vendor"],
        "readiness_percentage": progress["readiness_percentage"],
        "labs_completed": len(progress.get("labs_completed", [])),
        "assessments_passed": len([a for a in progress.get("assessments_completed", []) if a.get("passed")]),
        "projects_completed": len(progress.get("projects_completed", [])),
        "issued_at": datetime.now(timezone.utc).isoformat(),
        "share_url": f"/certificate/{cert_number}"
    }
    
    await db.user_certificates.insert_one(certificate)
    
    return certificate

@api_router.get("/certificates/{certificate_id}/download")
async def download_certificate(certificate_id: str, user: Dict = Depends(require_auth)):
    """Download certificate as PDF"""
    certificate = await db.user_certificates.find_one(
        {"certificate_id": certificate_id, "user_id": user["user_id"]},
        {"_id": 0}
    )
    
    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    # Generate PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4), 
                           rightMargin=50, leftMargin=50, 
                           topMargin=50, bottomMargin=50)
    
    elements = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Title'],
        fontSize=36,
        textColor=colors.HexColor('#06B6D4'),
        spaceAfter=20,
        alignment=TA_CENTER
    )
    
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Normal'],
        fontSize=14,
        textColor=colors.HexColor('#71717A'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    name_style = ParagraphStyle(
        'NameStyle',
        parent=styles['Title'],
        fontSize=28,
        textColor=colors.HexColor('#FFFFFF'),
        spaceAfter=20,
        alignment=TA_CENTER
    )
    
    cert_style = ParagraphStyle(
        'CertStyle',
        parent=styles['Normal'],
        fontSize=18,
        textColor=colors.HexColor('#A1A1AA'),
        spaceAfter=10,
        alignment=TA_CENTER
    )
    
    detail_style = ParagraphStyle(
        'DetailStyle',
        parent=styles['Normal'],
        fontSize=12,
        textColor=colors.HexColor('#71717A'),
        alignment=TA_CENTER
    )
    
    # Certificate content
    elements.append(Spacer(1, 30))
    elements.append(Paragraph("SKILLTRACK365", title_style))
    elements.append(Paragraph("Certificate of Completion", subtitle_style))
    elements.append(Spacer(1, 20))
    elements.append(Paragraph("This certifies that", cert_style))
    elements.append(Spacer(1, 10))
    elements.append(Paragraph(certificate["user_name"], name_style))
    elements.append(Spacer(1, 20))
    elements.append(Paragraph("has successfully completed the certification path for", cert_style))
    elements.append(Spacer(1, 10))
    elements.append(Paragraph(f"{certificate['vendor']} {certificate['cert_name']}", name_style))
    elements.append(Paragraph(f"({certificate['cert_code']})", cert_style))
    elements.append(Spacer(1, 30))
    
    # Stats
    stats_text = f"Readiness: {certificate['readiness_percentage']}% | Labs: {certificate['labs_completed']} | Assessments: {certificate['assessments_passed']} | Projects: {certificate['projects_completed']}"
    elements.append(Paragraph(stats_text, detail_style))
    elements.append(Spacer(1, 20))
    
    # Certificate ID and Date
    issued_date = datetime.fromisoformat(certificate["issued_at"].replace('Z', '+00:00')).strftime("%B %d, %Y")
    elements.append(Paragraph(f"Certificate ID: {certificate['certificate_id']}", detail_style))
    elements.append(Paragraph(f"Issued: {issued_date}", detail_style))
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    
    filename = f"SkillTrack365_{certificate['cert_code']}_{certificate['certificate_id']}.pdf"
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@api_router.get("/certificates/public/{certificate_id}")
async def get_public_certificate(certificate_id: str):
    """Get public certificate data for sharing"""
    certificate = await db.user_certificates.find_one(
        {"certificate_id": certificate_id},
        {"_id": 0, "user_email": 0}
    )
    
    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    return certificate

# ============== SHARE URL ROUTES ==============

@api_router.get("/share/certificate/{certificate_id}")
async def get_share_data(certificate_id: str):
    """Get shareable data for certificate"""
    certificate = await db.user_certificates.find_one(
        {"certificate_id": certificate_id},
        {"_id": 0, "user_email": 0}
    )
    
    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    return {
        "certificate": certificate,
        "share_text": f"I just earned my {certificate['vendor']} {certificate['cert_name']} certification on SkillTrack365! 🎉 #{certificate['vendor']} #CloudCertification",
        "twitter_url": f"https://twitter.com/intent/tweet?text={certificate['user_name']} earned {certificate['vendor']} {certificate['cert_name']} certification on SkillTrack365!",
        "linkedin_url": f"https://www.linkedin.com/sharing/share-offsite/"
    }

@api_router.get("/")
async def root():
    return {"message": "SkillTrack365 API", "version": "1.0.0"}

# Include router and add middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
