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
    role: str = "learner"  # learner, super_admin, content_admin, lab_admin, finance_admin, support_admin
    is_suspended: bool = False
    suspended_reason: Optional[str] = None
    suspended_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
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

class DiscussionPostCreate(BaseModel):
    cert_id: str
    title: str
    content: str

class DiscussionReplyCreate(BaseModel):
    post_id: str
    content: str

class VideoContentModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    video_id: str
    cert_id: str
    title: str
    description: str
    duration_minutes: int
    youtube_url: str
    thumbnail_url: Optional[str] = None
    order: int = 0


# Admin-specific models
class AdminUserUpdate(BaseModel):
    role: Optional[str] = None
    subscription_status: Optional[str] = None
    is_suspended: Optional[bool] = None
    suspended_reason: Optional[str] = None

class AdminRoleAssignment(BaseModel):
    role: str  # super_admin, content_admin, lab_admin, finance_admin, support_admin, learner


# ============== LAB ORCHESTRATION MODELS ==============

class CloudProvider(BaseModel):
    """Cloud provider configuration"""
    model_config = ConfigDict(extra="ignore")
    provider_id: str
    name: str  # AWS, GCP, Azure
    is_enabled: bool = True
    regions: List[str] = []
    resource_types: List[str] = []  # VM, Container, Storage, etc.

class LabInstance(BaseModel):
    """Active lab instance for a user"""
    model_config = ConfigDict(extra="ignore")
    instance_id: str = Field(default_factory=lambda: f"inst_{uuid.uuid4().hex[:12]}")
    user_id: str
    lab_id: str
    cert_id: str
    provider: str  # aws, gcp, azure
    region: str
    status: str = "provisioning"  # provisioning, running, suspended, terminated, error
    resources: Dict[str, Any] = {}  # Allocated resources
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: Optional[datetime] = None
    terminated_at: Optional[datetime] = None
    cost_estimate: float = 0.0
    error_message: Optional[str] = None

class ResourceQuota(BaseModel):
    """User resource quota configuration"""
    model_config = ConfigDict(extra="ignore")
    quota_id: str = Field(default_factory=lambda: f"quota_{uuid.uuid4().hex[:12]}")
    user_id: str
    max_concurrent_labs: int = 2
    max_daily_lab_hours: float = 4.0
    max_monthly_lab_hours: float = 40.0
    allowed_providers: List[str] = ["aws", "gcp", "azure"]
    allowed_instance_types: List[str] = ["small", "medium"]
    storage_limit_gb: int = 10
    current_usage: Dict[str, Any] = {}
    reset_at: Optional[datetime] = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LabInstanceCreate(BaseModel):
    lab_id: str
    provider: str = "aws"
    region: str = "us-east-1"
    instance_type: str = "small"

class LabInstanceAction(BaseModel):
    action: str  # suspend, resume, terminate, extend

class QuotaUpdate(BaseModel):
    max_concurrent_labs: Optional[int] = None
    max_daily_lab_hours: Optional[float] = None
    max_monthly_lab_hours: Optional[float] = None
    allowed_providers: Optional[List[str]] = None
    allowed_instance_types: Optional[List[str]] = None
    storage_limit_gb: Optional[int] = None


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


# Admin authorization helpers
async def require_admin(request: Request, allowed_roles: List[str] = None) -> Dict:
    """Require user to be an admin with specific role(s)"""
    user = await require_auth(request)
    
    # Check if user is suspended
    if user.get("is_suspended", False):
        raise HTTPException(status_code=403, detail="Account suspended")
    
    user_role = user.get("role", "learner")
    
    # Super admin has access to everything
    if user_role == "super_admin":
        return user
    
    # If specific roles are required, check if user has one of them
    if allowed_roles and user_role not in allowed_roles:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    # If no specific roles required, just check if user is any type of admin
    if not allowed_roles:
        admin_roles = ["super_admin", "content_admin", "lab_admin", "finance_admin", "support_admin"]
        if user_role not in admin_roles:
            raise HTTPException(status_code=403, detail="Admin access required")
    
    return user

async def require_super_admin(request: Request) -> Dict:
    """Require user to be a super admin"""
    return await require_admin(request, allowed_roles=["super_admin"])

# Dependency functions for FastAPI
async def get_admin(request: Request) -> Dict:
    """Dependency to get any admin user"""
    return await require_admin(request)

async def get_super_admin(request: Request) -> Dict:
    """Dependency to get super admin user"""
    return await require_super_admin(request)

async def get_support_or_super_admin(request: Request) -> Dict:
    """Dependency to get support or super admin user"""
    return await require_admin(request, allowed_roles=["super_admin", "support_admin"])


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
        # Check if suspended
        if existing_user.get("is_suspended", False):
            raise HTTPException(status_code=403, detail=f"Account suspended: {existing_user.get('suspended_reason', 'Contact support')}")
        
        # Update user data and last_login
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "name": user_data["name"], 
                "picture": user_data.get("picture"),
                "last_login": datetime.now(timezone.utc).isoformat()
            }}
        )
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        
        # Check if this is the first user (make them super_admin)
        total_users = await db.users.count_documents({})
        user_role = "super_admin" if total_users == 0 else "learner"
        
        new_user = {
            "user_id": user_id,
            "email": user_data["email"],
            "name": user_data["name"],
            "picture": user_data.get("picture"),
            "subscription_status": "free",
            "subscription_expires_at": None,
            "role": user_role,
            "is_suspended": False,
            "suspended_reason": None,
            "suspended_at": None,
            "last_login": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(new_user)
        
        if user_role == "super_admin":
            logger.info(f"First user created as super_admin: {user_data['email']}")
    
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
    host_url = str(os.environ['REACT_APP_BACKEND_URL'])
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

# ============== LEADERBOARD ROUTES ==============

XP_VALUES = {
    "lab_completed": 100,
    "assessment_passed": 150,
    "project_completed": 200,
    "certificate_earned": 500
}

@api_router.get("/leaderboard")
async def get_leaderboard(limit: int = 20):
    """Get top users by XP"""
    # Calculate XP for all users with progress
    pipeline = [
        {
            "$group": {
                "_id": "$user_id",
                "labs_count": {"$sum": {"$size": {"$ifNull": ["$labs_completed", []]}}},
                "assessments_passed": {
                    "$sum": {
                        "$size": {
                            "$filter": {
                                "input": {"$ifNull": ["$assessments_completed", []]},
                                "as": "a",
                                "cond": {"$eq": ["$$a.passed", True]}
                            }
                        }
                    }
                },
                "projects_count": {"$sum": {"$size": {"$ifNull": ["$projects_completed", []]}}}
            }
        }
    ]
    
    progress_data = await db.user_progress.aggregate(pipeline).to_list(1000)
    
    # Get certificates count per user
    cert_pipeline = [
        {"$group": {"_id": "$user_id", "cert_count": {"$sum": 1}}}
    ]
    cert_data = await db.user_certificates.aggregate(cert_pipeline).to_list(1000)
    cert_map = {c["_id"]: c["cert_count"] for c in cert_data}
    
    # Calculate XP and get user details
    leaderboard = []
    for p in progress_data:
        user_id = p["_id"]
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "name": 1, "picture": 1})
        if not user:
            continue
            
        xp = (
            p["labs_count"] * XP_VALUES["lab_completed"] +
            p["assessments_passed"] * XP_VALUES["assessment_passed"] +
            p["projects_count"] * XP_VALUES["project_completed"] +
            cert_map.get(user_id, 0) * XP_VALUES["certificate_earned"]
        )
        
        leaderboard.append({
            "user_id": user_id,
            "name": user.get("name", "Anonymous"),
            "picture": user.get("picture"),
            "xp": xp,
            "labs_completed": p["labs_count"],
            "assessments_passed": p["assessments_passed"],
            "projects_completed": p["projects_count"],
            "certificates_earned": cert_map.get(user_id, 0)
        })
    
    # Sort by XP and limit
    leaderboard.sort(key=lambda x: x["xp"], reverse=True)
    
    # Add rank
    for i, entry in enumerate(leaderboard[:limit]):
        entry["rank"] = i + 1
    
    return leaderboard[:limit]

@api_router.get("/leaderboard/me")
async def get_my_rank(user: Dict = Depends(require_auth)):
    """Get current user's rank and XP"""
    # Get user's progress across all certifications
    progress_list = await db.user_progress.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).to_list(100)
    
    labs_count = sum(len(p.get("labs_completed", [])) for p in progress_list)
    assessments_passed = sum(
        len([a for a in p.get("assessments_completed", []) if a.get("passed")])
        for p in progress_list
    )
    projects_count = sum(len(p.get("projects_completed", [])) for p in progress_list)
    
    # Get certificates count
    certs = await db.user_certificates.count_documents({"user_id": user["user_id"]})
    
    xp = (
        labs_count * XP_VALUES["lab_completed"] +
        assessments_passed * XP_VALUES["assessment_passed"] +
        projects_count * XP_VALUES["project_completed"] +
        certs * XP_VALUES["certificate_earned"]
    )
    
    # Calculate rank
    all_leaderboard = await get_leaderboard(limit=1000)
    rank = next((i + 1 for i, entry in enumerate(all_leaderboard) if entry["user_id"] == user["user_id"]), len(all_leaderboard) + 1)
    
    return {
        "user_id": user["user_id"],
        "name": user["name"],
        "picture": user.get("picture"),
        "xp": xp,
        "rank": rank,
        "labs_completed": labs_count,
        "assessments_passed": assessments_passed,
        "projects_completed": projects_count,
        "certificates_earned": certs
    }

# ============== DISCUSSION FORUM ROUTES ==============

@api_router.get("/discussions/{cert_id}")
async def get_discussions(cert_id: str, page: int = 1, limit: int = 20):
    """Get discussion posts for a certification"""
    skip = (page - 1) * limit
    
    posts = await db.discussion_posts.find(
        {"cert_id": cert_id},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Get reply counts
    for post in posts:
        reply_count = await db.discussion_replies.count_documents({"post_id": post["post_id"]})
        post["reply_count"] = reply_count
    
    total = await db.discussion_posts.count_documents({"cert_id": cert_id})
    
    return {
        "posts": posts,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }

@api_router.get("/discussions/post/{post_id}")
async def get_discussion_post(post_id: str):
    """Get a single discussion post with replies"""
    post = await db.discussion_posts.find_one({"post_id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    replies = await db.discussion_replies.find(
        {"post_id": post_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(100)
    
    return {
        "post": post,
        "replies": replies
    }

@api_router.post("/discussions")
async def create_discussion_post(data: DiscussionPostCreate, user: Dict = Depends(require_auth)):
    """Create a new discussion post"""
    post = {
        "post_id": f"post_{uuid.uuid4().hex[:12]}",
        "cert_id": data.cert_id,
        "user_id": user["user_id"],
        "user_name": user["name"],
        "user_picture": user.get("picture"),
        "title": data.title,
        "content": data.content,
        "likes": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.discussion_posts.insert_one(post)
    post.pop("_id", None)
    return post

@api_router.post("/discussions/reply")
async def create_discussion_reply(data: DiscussionReplyCreate, user: Dict = Depends(require_auth)):
    """Create a reply to a discussion post"""
    # Verify post exists
    post = await db.discussion_posts.find_one({"post_id": data.post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    reply = {
        "reply_id": f"reply_{uuid.uuid4().hex[:12]}",
        "post_id": data.post_id,
        "user_id": user["user_id"],
        "user_name": user["name"],
        "user_picture": user.get("picture"),
        "content": data.content,
        "likes": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.discussion_replies.insert_one(reply)
    reply.pop("_id", None)
    return reply

@api_router.post("/discussions/{post_id}/like")
async def like_discussion_post(post_id: str, user: Dict = Depends(require_auth)):
    """Like a discussion post"""
    result = await db.discussion_posts.update_one(
        {"post_id": post_id},
        {"$inc": {"likes": 1}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"success": True}

# ============== VIDEO CONTENT ROUTES ==============

@api_router.get("/videos/{cert_id}")
async def get_videos(cert_id: str):
    """Get video content for a certification"""
    videos = await db.videos.find(
        {"cert_id": cert_id},
        {"_id": 0}
    ).sort("order", 1).to_list(100)
    return videos

@api_router.get("/videos/watch/{video_id}")
async def get_video(video_id: str):
    """Get a single video"""
    video = await db.videos.find_one({"video_id": video_id}, {"_id": 0})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return video

@api_router.post("/videos/{video_id}/complete")
async def mark_video_complete(video_id: str, user: Dict = Depends(require_auth)):
    """Mark a video as watched"""
    video = await db.videos.find_one({"video_id": video_id}, {"_id": 0})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    # Add to user's watched videos
    await db.user_videos.update_one(
        {"user_id": user["user_id"], "video_id": video_id},
        {
            "$set": {
                "watched_at": datetime.now(timezone.utc).isoformat()
            },
            "$setOnInsert": {
                "user_id": user["user_id"],
                "video_id": video_id,
                "cert_id": video["cert_id"]
            }
        },
        upsert=True
    )
    return {"success": True}

@api_router.get("/videos/{cert_id}/progress")
async def get_video_progress(cert_id: str, user: Dict = Depends(require_auth)):
    """Get user's video progress for a certification"""
    watched = await db.user_videos.find(
        {"user_id": user["user_id"], "cert_id": cert_id},
        {"_id": 0, "video_id": 1}
    ).to_list(100)
    
    total = await db.videos.count_documents({"cert_id": cert_id})
    watched_count = len(watched)
    
    return {
        "watched_videos": [w["video_id"] for w in watched],
        "watched_count": watched_count,
        "total_count": total,
        "progress_percentage": int((watched_count / total) * 100) if total > 0 else 0
    }

# ============== SEED VIDEO DATA ==============

@api_router.post("/seed-videos")
async def seed_video_data():
    """Seed video content for certifications"""
    existing = await db.videos.find_one({})
    if existing:
        return {"message": "Videos already seeded"}
    
    videos = [
        # AWS SAA Videos
        {
            "video_id": "vid-aws-saa-1",
            "cert_id": "aws-saa-c03",
            "title": "Introduction to AWS Solutions Architecture",
            "description": "Learn the fundamentals of designing solutions on AWS, including key services and architectural best practices.",
            "duration_minutes": 15,
            "youtube_url": "https://www.youtube.com/embed/Ia-UEYYR44s",
            "thumbnail_url": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400",
            "order": 1
        },
        {
            "video_id": "vid-aws-saa-2",
            "cert_id": "aws-saa-c03",
            "title": "AWS VPC Deep Dive",
            "description": "Master Virtual Private Cloud concepts including subnets, route tables, and security groups.",
            "duration_minutes": 20,
            "youtube_url": "https://www.youtube.com/embed/hiKPPy584Mg",
            "thumbnail_url": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400",
            "order": 2
        },
        {
            "video_id": "vid-aws-saa-3",
            "cert_id": "aws-saa-c03",
            "title": "EC2 Instance Types and Use Cases",
            "description": "Understanding EC2 instance families and choosing the right instance for your workload.",
            "duration_minutes": 18,
            "youtube_url": "https://www.youtube.com/embed/iHX-jtKIVNA",
            "thumbnail_url": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400",
            "order": 3
        },
        # Azure AZ-900 Videos
        {
            "video_id": "vid-az-900-1",
            "cert_id": "az-900",
            "title": "Azure Fundamentals Overview",
            "description": "Introduction to cloud computing concepts and Azure's core services.",
            "duration_minutes": 12,
            "youtube_url": "https://www.youtube.com/embed/NKEFWyqJ5XA",
            "thumbnail_url": "https://images.unsplash.com/photo-1526498460520-4c246339dccb?w=400",
            "order": 1
        },
        {
            "video_id": "vid-az-900-2",
            "cert_id": "az-900",
            "title": "Azure Resource Management",
            "description": "Learn about resource groups, subscriptions, and management groups in Azure.",
            "duration_minutes": 14,
            "youtube_url": "https://www.youtube.com/embed/gIyvkFahKqQ",
            "thumbnail_url": "https://images.unsplash.com/photo-1535191042502-e6a9a3d407e7?w=400",
            "order": 2
        },
        # GCP ACE Videos
        {
            "video_id": "vid-gcp-ace-1",
            "cert_id": "gcp-ace",
            "title": "Getting Started with Google Cloud",
            "description": "Introduction to GCP console, projects, and core services.",
            "duration_minutes": 16,
            "youtube_url": "https://www.youtube.com/embed/IeMYQ-qJeK4",
            "thumbnail_url": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400",
            "order": 1
        },
        {
            "video_id": "vid-gcp-ace-2",
            "cert_id": "gcp-ace",
            "title": "GCP Compute Engine Basics",
            "description": "Learn to create and manage virtual machines on Google Cloud Platform.",
            "duration_minutes": 19,
            "youtube_url": "https://www.youtube.com/embed/1XH0gLlGDdk",
            "thumbnail_url": "https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=400",
            "order": 2
        }
    ]
    
    await db.videos.insert_many(videos)
    return {"message": "Videos seeded successfully", "count": len(videos)}

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

# ============== SMART LEARNING & RECOMMENDATIONS ==============

@api_router.get("/recommendations/{cert_id}")
async def get_recommendations(cert_id: str, user: Dict = Depends(require_auth)):
    """Get smart learning recommendations based on user progress and weak areas"""
    
    # Get user progress
    progress = await db.user_progress.find_one(
        {"user_id": user["user_id"], "cert_id": cert_id},
        {"_id": 0}
    )
    
    # Get certification details
    cert = await db.certifications.find_one({"cert_id": cert_id}, {"_id": 0})
    if not cert:
        raise HTTPException(status_code=404, detail="Certification not found")
    
    # Get all labs, assessments, projects
    labs = await db.labs.find({"cert_id": cert_id}, {"_id": 0, "instructions": 0}).to_list(100)
    assessments = await db.assessments.find({"cert_id": cert_id}, {"_id": 0, "questions": 0}).to_list(100)
    projects = await db.projects.find({"cert_id": cert_id}, {"_id": 0, "tasks": 0}).to_list(100)
    
    completed_labs = progress.get("labs_completed", []) if progress else []
    completed_assessments = [a["assessment_id"] for a in progress.get("assessments_completed", [])] if progress else []
    completed_projects = progress.get("projects_completed", []) if progress else []
    
    # Analyze weak areas from assessments
    weak_domains = {}
    if progress:
        for assessment_result in progress.get("assessments_completed", []):
            for weak_area in assessment_result.get("weak_areas", []):
                weak_domains[weak_area] = weak_domains.get(weak_area, 0) + 1
    
    # Calculate domain scores based on completed work
    domain_scores = {}
    domain_labs_total = {}
    domain_labs_completed = {}
    
    for lab in labs:
        domain = lab.get("exam_domain", "General")
        domain_labs_total[domain] = domain_labs_total.get(domain, 0) + 1
        if lab["lab_id"] in completed_labs:
            domain_labs_completed[domain] = domain_labs_completed.get(domain, 0) + 1
    
    for domain in domain_labs_total:
        completed = domain_labs_completed.get(domain, 0)
        total = domain_labs_total[domain]
        # Subtract weakness penalty
        weakness_penalty = weak_domains.get(domain, 0) * 10
        score = max(0, int((completed / total) * 100) - weakness_penalty)
        domain_scores[domain] = min(100, score)
    
    # Find next best actions
    next_lab = None
    next_assessment = None
    next_project = None
    
    # Prioritize labs in weak domains
    sorted_domains = sorted(domain_scores.items(), key=lambda x: x[1])
    for domain, score in sorted_domains:
        for lab in labs:
            if lab["lab_id"] not in completed_labs and lab.get("exam_domain") == domain:
                next_lab = lab
                break
        if next_lab:
            break
    
    # If no weak domain lab, find any incomplete lab
    if not next_lab:
        for lab in labs:
            if lab["lab_id"] not in completed_labs:
                next_lab = lab
                break
    
    # Find next assessment
    for assessment in assessments:
        if assessment["assessment_id"] not in completed_assessments:
            next_assessment = assessment
            break
    
    # Find next project
    for project in projects:
        if project["project_id"] not in completed_projects:
            next_project = project
            break
    
    # Determine primary action based on progress
    readiness = progress.get("readiness_percentage", 0) if progress else 0
    labs_ratio = len(completed_labs) / max(len(labs), 1)
    assessments_ratio = len(completed_assessments) / max(len(assessments), 1)
    
    if labs_ratio < 0.5:
        primary_action = "lab"
        action_reason = "Build practical skills through hands-on labs"
    elif assessments_ratio < 0.5:
        primary_action = "assessment"
        action_reason = "Validate your knowledge with assessments"
    elif next_project:
        primary_action = "project"
        action_reason = "Apply your skills in real-world projects"
    else:
        primary_action = "review"
        action_reason = "Review weak areas and retake assessments"
    
    return {
        "certification": {
            "cert_id": cert["cert_id"],
            "name": cert["name"],
            "vendor": cert["vendor"]
        },
        "readiness": readiness,
        "domain_scores": domain_scores,
        "weak_domains": list(weak_domains.keys()),
        "primary_action": primary_action,
        "action_reason": action_reason,
        "next_lab": next_lab,
        "next_assessment": next_assessment,
        "next_project": next_project,
        "progress_summary": {
            "labs_completed": len(completed_labs),
            "labs_total": len(labs),
            "assessments_completed": len(completed_assessments),
            "assessments_total": len(assessments),
            "projects_completed": len(completed_projects),
            "projects_total": len(projects)
        }
    }

@api_router.get("/roadmap/{cert_id}")
async def get_certification_roadmap(cert_id: str, request: Request):
    """Get certification learning roadmap with progress"""
    
    cert = await db.certifications.find_one({"cert_id": cert_id}, {"_id": 0})
    if not cert:
        raise HTTPException(status_code=404, detail="Certification not found")
    
    # Get all content
    labs = await db.labs.find({"cert_id": cert_id}, {"_id": 0, "instructions": 0}).to_list(100)
    assessments = await db.assessments.find({"cert_id": cert_id}, {"_id": 0, "questions": 0}).to_list(100)
    projects = await db.projects.find({"cert_id": cert_id}, {"_id": 0, "tasks": 0}).to_list(100)
    
    # Get user progress if authenticated
    user = await get_current_user(request)
    progress = None
    if user:
        progress = await db.user_progress.find_one(
            {"user_id": user["user_id"], "cert_id": cert_id},
            {"_id": 0}
        )
    
    completed_labs = progress.get("labs_completed", []) if progress else []
    completed_assessments = {a["assessment_id"]: a for a in progress.get("assessments_completed", [])} if progress else {}
    completed_projects = progress.get("projects_completed", []) if progress else []
    
    # Group labs by domain
    labs_by_domain = {}
    for lab in labs:
        domain = lab.get("exam_domain", "General")
        if domain not in labs_by_domain:
            labs_by_domain[domain] = []
        lab["completed"] = lab["lab_id"] in completed_labs
        labs_by_domain[domain].append(lab)
    
    # Build roadmap stages
    stages = []
    
    # Stage 1: Exam Domains Overview
    stages.append({
        "stage": 1,
        "title": "Exam Domains",
        "description": "Understand what you'll be tested on",
        "type": "domains",
        "items": cert.get("exam_domains", []),
        "completed": True  # Always show as completed
    })
    
    # Stage 2: Cloud Labs (grouped by domain)
    domain_stages = []
    for domain in cert.get("exam_domains", []):
        domain_name = domain["name"]
        domain_labs = labs_by_domain.get(domain_name, [])
        completed_count = sum(1 for l in domain_labs if l.get("completed"))
        domain_stages.append({
            "domain": domain_name,
            "weight": domain["weight"],
            "labs": domain_labs,
            "completed_count": completed_count,
            "total_count": len(domain_labs),
            "progress": int((completed_count / max(len(domain_labs), 1)) * 100)
        })
    
    stages.append({
        "stage": 2,
        "title": "Cloud Labs",
        "description": "Hands-on practice in simulated environments",
        "type": "labs",
        "domains": domain_stages,
        "total_completed": len(completed_labs),
        "total_count": len(labs),
        "completed": len(completed_labs) >= len(labs)
    })
    
    # Stage 3: Assessments
    assessment_items = []
    for assessment in assessments:
        result = completed_assessments.get(assessment["assessment_id"])
        assessment_items.append({
            **assessment,
            "completed": result is not None,
            "passed": result.get("passed", False) if result else False,
            "score": result.get("score", 0) if result else 0
        })
    
    passed_count = sum(1 for a in assessment_items if a.get("passed"))
    stages.append({
        "stage": 3,
        "title": "Assessments",
        "description": "Validate your knowledge with practice tests",
        "type": "assessments",
        "items": assessment_items,
        "passed_count": passed_count,
        "total_count": len(assessments),
        "completed": passed_count >= len(assessments)
    })
    
    # Stage 4: Projects
    project_items = []
    for project in projects:
        project_items.append({
            **project,
            "completed": project["project_id"] in completed_projects
        })
    
    completed_project_count = len(completed_projects)
    stages.append({
        "stage": 4,
        "title": "Projects",
        "description": "Apply skills to real-world scenarios",
        "type": "projects",
        "items": project_items,
        "completed_count": completed_project_count,
        "total_count": len(projects),
        "completed": completed_project_count >= len(projects)
    })
    
    # Stage 5: Exam Readiness
    readiness = progress.get("readiness_percentage", 0) if progress else 0
    stages.append({
        "stage": 5,
        "title": "Exam Ready",
        "description": "You're prepared to take the certification exam!",
        "type": "readiness",
        "readiness_percentage": readiness,
        "completed": readiness >= 80
    })
    
    return {
        "certification": cert,
        "stages": stages,
        "overall_progress": {
            "readiness": readiness,
            "current_stage": next((i+1 for i, s in enumerate(stages) if not s.get("completed")), 5)
        }
    }

# ============== ACHIEVEMENT BADGES ==============

BADGE_DEFINITIONS = [
    {"badge_id": "first_lab", "name": "First Steps", "description": "Complete your first lab", "icon": "terminal", "requirement": {"type": "labs", "count": 1}},
    {"badge_id": "lab_5", "name": "Lab Enthusiast", "description": "Complete 5 labs", "icon": "terminal", "requirement": {"type": "labs", "count": 5}},
    {"badge_id": "lab_10", "name": "Lab Expert", "description": "Complete 10 labs", "icon": "terminal", "requirement": {"type": "labs", "count": 10}},
    {"badge_id": "lab_25", "name": "Lab Master", "description": "Complete 25 labs", "icon": "terminal", "requirement": {"type": "labs", "count": 25}},
    {"badge_id": "first_assessment", "name": "Test Taker", "description": "Pass your first assessment", "icon": "file-text", "requirement": {"type": "assessments", "count": 1}},
    {"badge_id": "assessment_5", "name": "Assessment Ace", "description": "Pass 5 assessments", "icon": "file-text", "requirement": {"type": "assessments", "count": 5}},
    {"badge_id": "perfect_score", "name": "Perfect Score", "description": "Score 100% on an assessment", "icon": "star", "requirement": {"type": "perfect_score", "count": 1}},
    {"badge_id": "first_project", "name": "Builder", "description": "Complete your first project", "icon": "folder", "requirement": {"type": "projects", "count": 1}},
    {"badge_id": "project_3", "name": "Project Pro", "description": "Complete 3 projects", "icon": "folder", "requirement": {"type": "projects", "count": 3}},
    {"badge_id": "first_cert", "name": "Certified", "description": "Earn your first certificate", "icon": "award", "requirement": {"type": "certificates", "count": 1}},
    {"badge_id": "multi_cert", "name": "Multi-Cloud", "description": "Earn certificates in 3+ vendors", "icon": "cloud", "requirement": {"type": "multi_vendor", "count": 3}},
    {"badge_id": "streak_7", "name": "Weekly Warrior", "description": "7-day learning streak", "icon": "flame", "requirement": {"type": "streak", "count": 7}},
    {"badge_id": "xp_1000", "name": "Rising Star", "description": "Earn 1000 XP", "icon": "zap", "requirement": {"type": "xp", "count": 1000}},
    {"badge_id": "xp_5000", "name": "Power Learner", "description": "Earn 5000 XP", "icon": "zap", "requirement": {"type": "xp", "count": 5000}},
    {"badge_id": "discussion_starter", "name": "Conversation Starter", "description": "Create 5 discussion posts", "icon": "message", "requirement": {"type": "discussions", "count": 5}},
    {"badge_id": "helper", "name": "Community Helper", "description": "Get 10 likes on your posts/replies", "icon": "heart", "requirement": {"type": "likes_received", "count": 10}},
]

@api_router.get("/badges")
async def get_user_badges(user: Dict = Depends(require_auth)):
    """Get user's earned and available badges"""
    
    # Get all user progress
    all_progress = await db.user_progress.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(100)
    
    # Get certificates
    certificates = await db.user_certificates.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(100)
    
    # Get discussion stats
    posts = await db.forum_posts.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(1000)
    total_likes = sum(p.get("likes", 0) for p in posts)
    
    # Calculate totals
    total_labs = sum(len(p.get("labs_completed", [])) for p in all_progress)
    total_assessments_passed = sum(len([a for a in p.get("assessments_completed", []) if a.get("passed")]) for p in all_progress)
    total_projects = sum(len(p.get("projects_completed", [])) for p in all_progress)
    perfect_scores = sum(1 for p in all_progress for a in p.get("assessments_completed", []) if a.get("score") == 100)
    
    # Calculate XP
    xp = total_labs * 100 + total_assessments_passed * 150 + total_projects * 200 + len(certificates) * 500
    
    # Get unique vendors from certificates
    vendors = set(c.get("vendor") for c in certificates)
    
    # Check which badges are earned
    earned_badges = []
    available_badges = []
    
    stats = {
        "labs": total_labs,
        "assessments": total_assessments_passed,
        "projects": total_projects,
        "certificates": len(certificates),
        "perfect_score": perfect_scores,
        "multi_vendor": len(vendors),
        "xp": xp,
        "discussions": len(posts),
        "likes_received": total_likes,
        "streak": 0  # TODO: implement streak tracking
    }
    
    for badge in BADGE_DEFINITIONS:
        req = badge["requirement"]
        req_type = req["type"]
        req_count = req["count"]
        
        current_count = stats.get(req_type, 0)
        is_earned = current_count >= req_count
        
        badge_data = {
            **badge,
            "earned": is_earned,
            "progress": min(current_count, req_count),
            "progress_max": req_count
        }
        
        if is_earned:
            earned_badges.append(badge_data)
        else:
            available_badges.append(badge_data)
    
    return {
        "earned": earned_badges,
        "available": available_badges,
        "stats": stats
    }

# ============== CERTIFICATION-SPECIFIC LEADERBOARDS ==============

@api_router.get("/leaderboard/certification/{cert_id}")
async def get_certification_leaderboard(cert_id: str, limit: int = 20):
    """Get leaderboard for a specific certification"""
    
    cert = await db.certifications.find_one({"cert_id": cert_id}, {"_id": 0})
    if not cert:
        raise HTTPException(status_code=404, detail="Certification not found")
    
    # Get all progress for this certification
    all_progress = await db.user_progress.find({"cert_id": cert_id}, {"_id": 0}).to_list(1000)
    
    # Get user details for all users with progress
    user_ids = [p["user_id"] for p in all_progress]
    users = await db.users.find({"user_id": {"$in": user_ids}}, {"_id": 0}).to_list(1000)
    user_map = {u["user_id"]: u for u in users}
    
    # Build leaderboard
    leaderboard = []
    for progress in all_progress:
        user = user_map.get(progress["user_id"], {})
        labs_completed = len(progress.get("labs_completed", []))
        assessments_passed = len([a for a in progress.get("assessments_completed", []) if a.get("passed")])
        projects_completed = len(progress.get("projects_completed", []))
        
        # Calculate XP for this cert only
        xp = labs_completed * 100 + assessments_passed * 150 + projects_completed * 200
        
        # Check if user has certificate for this cert
        certificate = await db.user_certificates.find_one(
            {"user_id": progress["user_id"], "cert_id": cert_id},
            {"_id": 0}
        )
        if certificate:
            xp += 500
        
        leaderboard.append({
            "user_id": progress["user_id"],
            "name": user.get("name", "Unknown"),
            "picture": user.get("picture"),
            "xp": xp,
            "readiness": progress.get("readiness_percentage", 0),
            "labs_completed": labs_completed,
            "assessments_passed": assessments_passed,
            "projects_completed": projects_completed,
            "has_certificate": certificate is not None
        })
    
    # Sort by XP
    leaderboard.sort(key=lambda x: x["xp"], reverse=True)
    
    # Add ranks
    for i, entry in enumerate(leaderboard[:limit]):
        entry["rank"] = i + 1
    
    return {
        "certification": {
            "cert_id": cert["cert_id"],
            "name": cert["name"],
            "vendor": cert["vendor"]
        },
        "leaderboard": leaderboard[:limit],
        "total_learners": len(leaderboard)
    }

# ============== PUBLIC PROFILES ==============

@api_router.get("/profile/public/{user_id}")
async def get_public_profile(user_id: str):
    """Get public profile data for a user"""
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "email": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if profile is public
    profile_settings = await db.profile_settings.find_one({"user_id": user_id}, {"_id": 0})
    if not profile_settings or not profile_settings.get("is_public", False):
        raise HTTPException(status_code=403, detail="Profile is private")
    
    # Get all progress
    all_progress = await db.user_progress.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    
    # Get certificates
    certificates = await db.user_certificates.find(
        {"user_id": user_id},
        {"_id": 0, "user_email": 0}
    ).to_list(100)
    
    # Get badges
    badges_response = await get_user_badges_internal(user_id)
    
    # Calculate stats
    total_labs = sum(len(p.get("labs_completed", [])) for p in all_progress)
    total_assessments = sum(len([a for a in p.get("assessments_completed", []) if a.get("passed")]) for p in all_progress)
    total_projects = sum(len(p.get("projects_completed", [])) for p in all_progress)
    total_xp = total_labs * 100 + total_assessments * 150 + total_projects * 200 + len(certificates) * 500
    
    # Get certification names
    cert_ids = [p["cert_id"] for p in all_progress]
    certs = await db.certifications.find({"cert_id": {"$in": cert_ids}}, {"_id": 0}).to_list(100)
    cert_map = {c["cert_id"]: c for c in certs}
    
    certifications_progress = []
    for p in all_progress:
        cert = cert_map.get(p["cert_id"], {})
        certifications_progress.append({
            "cert_id": p["cert_id"],
            "cert_name": cert.get("name", "Unknown"),
            "vendor": cert.get("vendor", ""),
            "readiness": p.get("readiness_percentage", 0)
        })
    
    return {
        "user": {
            "user_id": user["user_id"],
            "name": user["name"],
            "picture": user.get("picture"),
            "created_at": user.get("created_at")
        },
        "stats": {
            "total_xp": total_xp,
            "labs_completed": total_labs,
            "assessments_passed": total_assessments,
            "projects_completed": total_projects,
            "certificates_earned": len(certificates)
        },
        "certifications": certifications_progress,
        "certificates": certificates,
        "badges": badges_response.get("earned", [])
    }

async def get_user_badges_internal(user_id: str):
    """Internal helper to get badges for any user"""
    all_progress = await db.user_progress.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    certificates = await db.user_certificates.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    posts = await db.forum_posts.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    total_likes = sum(p.get("likes", 0) for p in posts)
    
    total_labs = sum(len(p.get("labs_completed", [])) for p in all_progress)
    total_assessments_passed = sum(len([a for a in p.get("assessments_completed", []) if a.get("passed")]) for p in all_progress)
    total_projects = sum(len(p.get("projects_completed", [])) for p in all_progress)
    perfect_scores = sum(1 for p in all_progress for a in p.get("assessments_completed", []) if a.get("score") == 100)
    xp = total_labs * 100 + total_assessments_passed * 150 + total_projects * 200 + len(certificates) * 500
    vendors = set(c.get("vendor") for c in certificates)
    
    stats = {
        "labs": total_labs,
        "assessments": total_assessments_passed,
        "projects": total_projects,
        "certificates": len(certificates),
        "perfect_score": perfect_scores,
        "multi_vendor": len(vendors),
        "xp": xp,
        "discussions": len(posts),
        "likes_received": total_likes,
        "streak": 0
    }
    
    earned_badges = []
    for badge in BADGE_DEFINITIONS:
        req = badge["requirement"]
        if stats.get(req["type"], 0) >= req["count"]:
            earned_badges.append({**badge, "earned": True})
    
    return {"earned": earned_badges, "stats": stats}

@api_router.put("/profile/settings")
async def update_profile_settings(request: Request, user: Dict = Depends(require_auth)):
    """Update user profile settings (public/private)"""
    body = await request.json()
    is_public = body.get("is_public", False)
    
    await db.profile_settings.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"user_id": user["user_id"], "is_public": is_public, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    
    return {"message": "Settings updated", "is_public": is_public}

@api_router.get("/profile/settings")
async def get_profile_settings(user: Dict = Depends(require_auth)):
    """Get user profile settings"""
    settings = await db.profile_settings.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return settings or {"user_id": user["user_id"], "is_public": False}

# ============== DISCUSSION UPGRADES ==============

@api_router.post("/discussions/{post_id}/upvote")
async def upvote_discussion(post_id: str, user: Dict = Depends(require_auth)):
    """Upvote a discussion post"""
    post = await db.forum_posts.find_one({"post_id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Check if already upvoted
    existing = await db.discussion_votes.find_one(
        {"post_id": post_id, "user_id": user["user_id"], "type": "upvote"},
        {"_id": 0}
    )
    
    if existing:
        # Remove upvote
        await db.discussion_votes.delete_one({"post_id": post_id, "user_id": user["user_id"], "type": "upvote"})
        await db.forum_posts.update_one({"post_id": post_id}, {"$inc": {"upvotes": -1}})
        return {"upvoted": False, "upvotes": max(0, post.get("upvotes", 0) - 1)}
    else:
        # Add upvote
        await db.discussion_votes.insert_one({
            "vote_id": f"vote_{uuid.uuid4().hex[:12]}",
            "post_id": post_id,
            "user_id": user["user_id"],
            "type": "upvote",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        await db.forum_posts.update_one({"post_id": post_id}, {"$inc": {"upvotes": 1}})
        return {"upvoted": True, "upvotes": post.get("upvotes", 0) + 1}

@api_router.post("/discussions/reply/{reply_id}/best")
async def mark_best_answer(reply_id: str, user: Dict = Depends(require_auth)):
    """Mark a reply as best answer (only post author can do this)"""
    
    reply = await db.forum_replies.find_one({"reply_id": reply_id}, {"_id": 0})
    if not reply:
        raise HTTPException(status_code=404, detail="Reply not found")
    
    post = await db.forum_posts.find_one({"post_id": reply["post_id"]}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if post["user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Only post author can mark best answer")
    
    # Clear any existing best answer
    await db.forum_replies.update_many(
        {"post_id": reply["post_id"]},
        {"$set": {"is_best_answer": False}}
    )
    
    # Mark this reply as best
    await db.forum_replies.update_one(
        {"reply_id": reply_id},
        {"$set": {"is_best_answer": True}}
    )
    
    return {"message": "Best answer marked", "reply_id": reply_id}

# ============== DROP-OFF DETECTION ==============

@api_router.get("/engagement/status")
async def get_engagement_status(user: Dict = Depends(require_auth)):
    """Get user engagement status and nudges"""
    
    # Get last activity
    last_progress = await db.user_progress.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).sort("updated_at", -1).limit(1).to_list(1)
    
    nudges = []
    days_inactive = 0
    
    if last_progress:
        last_update = last_progress[0].get("updated_at")
        if last_update:
            if isinstance(last_update, str):
                last_update = datetime.fromisoformat(last_update.replace('Z', '+00:00'))
            if last_update.tzinfo is None:
                last_update = last_update.replace(tzinfo=timezone.utc)
            days_inactive = (datetime.now(timezone.utc) - last_update).days
    else:
        days_inactive = 999  # Never started
    
    # Generate nudges based on inactivity
    if days_inactive >= 7:
        nudges.append({
            "type": "return",
            "title": "We miss you!",
            "message": f"It's been {days_inactive} days since your last activity. Jump back in!",
            "action": "Continue Learning",
            "priority": "high"
        })
    elif days_inactive >= 3:
        nudges.append({
            "type": "reminder",
            "title": "Keep the momentum!",
            "message": "Don't break your learning streak. Complete a quick lab today!",
            "action": "Start a Lab",
            "priority": "medium"
        })
    
    # Check for incomplete certifications
    all_progress = await db.user_progress.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(100)
    
    for progress in all_progress:
        readiness = progress.get("readiness_percentage", 0)
        if 50 <= readiness < 80:
            cert = await db.certifications.find_one({"cert_id": progress["cert_id"]}, {"_id": 0})
            if cert:
                nudges.append({
                    "type": "finish",
                    "title": f"Almost there!",
                    "message": f"You're {readiness}% ready for {cert['name']}. Just a few more steps!",
                    "action": "Continue",
                    "cert_id": progress["cert_id"],
                    "priority": "high" if readiness >= 70 else "medium"
                })
    
    return {
        "days_inactive": days_inactive,
        "nudges": nudges,
        "engagement_level": "high" if days_inactive < 3 else "medium" if days_inactive < 7 else "low"
    }

# ============== CATALOG ROUTES ==============

@api_router.get("/catalog/labs")
async def get_labs_catalog(
    request: Request,
    search: Optional[str] = None,
    certification: Optional[str] = None,
    vendor: Optional[str] = None,
    difficulty: Optional[str] = None,
    domain: Optional[str] = None,
    page: int = 1,
    limit: int = 12
):
    """Get all labs across all certifications with filters"""
    user = await get_current_user(request)
    
    # Build query filter
    query = {}
    if certification:
        query["cert_id"] = certification
    if difficulty:
        query["difficulty"] = difficulty
    if domain:
        query["exam_domain"] = {"$regex": domain, "$options": "i"}
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    # Get all labs
    all_labs = await db.labs.find(query, {"_id": 0, "instructions": 0}).to_list(500)
    
    # Get all certifications for mapping and vendor filter
    certifications = await db.certifications.find({}, {"_id": 0}).to_list(100)
    cert_map = {c["cert_id"]: c for c in certifications}
    
    # Filter by vendor if specified
    if vendor:
        all_labs = [lab for lab in all_labs if cert_map.get(lab["cert_id"], {}).get("vendor", "").lower() == vendor.lower()]
    
    # Get user progress for status
    user_completed_labs = set()
    if user:
        progress_list = await db.user_progress.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(100)
        for progress in progress_list:
            user_completed_labs.update(progress.get("labs_completed", []))
    
    # Enrich labs with certification info and status
    enriched_labs = []
    for lab in all_labs:
        cert = cert_map.get(lab["cert_id"], {})
        lab["certification_name"] = cert.get("name", "Unknown")
        lab["vendor"] = cert.get("vendor", "Unknown")
        lab["status"] = "completed" if lab["lab_id"] in user_completed_labs else "not_started"
        lab["is_locked"] = user is None or (user.get("subscription_status") != "premium" and lab.get("difficulty") == "Advanced")
        enriched_labs.append(lab)
    
    # Get unique filter options
    vendors = list(set(cert.get("vendor") for cert in certifications))
    difficulties = list(set(lab.get("difficulty") for lab in enriched_labs if lab.get("difficulty")))
    domains = list(set(lab.get("exam_domain") for lab in enriched_labs if lab.get("exam_domain")))
    
    # Pagination
    total = len(enriched_labs)
    start = (page - 1) * limit
    end = start + limit
    paginated_labs = enriched_labs[start:end]
    
    return {
        "labs": paginated_labs,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
        "filters": {
            "certifications": [{"cert_id": c["cert_id"], "name": c["name"], "vendor": c["vendor"]} for c in certifications],
            "vendors": sorted(vendors),
            "difficulties": sorted(difficulties),
            "domains": sorted(domains)
        }
    }

@api_router.get("/catalog/projects")
async def get_projects_catalog(
    request: Request,
    search: Optional[str] = None,
    certification: Optional[str] = None,
    vendor: Optional[str] = None,
    difficulty: Optional[str] = None,
    technology: Optional[str] = None,
    page: int = 1,
    limit: int = 12
):
    """Get all projects across all certifications with filters"""
    user = await get_current_user(request)
    
    # Build query filter
    query = {}
    if certification:
        query["cert_id"] = certification
    if difficulty:
        query["difficulty"] = difficulty
    if technology:
        query["technologies"] = {"$regex": technology, "$options": "i"}
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"business_scenario": {"$regex": search, "$options": "i"}}
        ]
    
    # Get all projects
    all_projects = await db.projects.find(query, {"_id": 0, "tasks": 0}).to_list(500)
    
    # Get all certifications for mapping and vendor filter
    certifications = await db.certifications.find({}, {"_id": 0}).to_list(100)
    cert_map = {c["cert_id"]: c for c in certifications}
    
    # Filter by vendor if specified
    if vendor:
        all_projects = [proj for proj in all_projects if cert_map.get(proj["cert_id"], {}).get("vendor", "").lower() == vendor.lower()]
    
    # Get user progress for status
    user_completed_projects = set()
    if user:
        progress_list = await db.user_progress.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(100)
        for progress in progress_list:
            user_completed_projects.update(progress.get("projects_completed", []))
    
    # Enrich projects with certification info and status
    enriched_projects = []
    all_technologies = set()
    for proj in all_projects:
        cert = cert_map.get(proj["cert_id"], {})
        proj["certification_name"] = cert.get("name", "Unknown")
        proj["vendor"] = cert.get("vendor", "Unknown")
        proj["status"] = "completed" if proj["project_id"] in user_completed_projects else "not_started"
        proj["is_locked"] = user is None or (user.get("subscription_status") != "premium" and proj.get("difficulty") == "Advanced")
        enriched_projects.append(proj)
        if proj.get("technologies"):
            all_technologies.update(proj["technologies"])
    
    # Get unique filter options
    vendors = list(set(cert.get("vendor") for cert in certifications))
    difficulties = list(set(proj.get("difficulty") for proj in enriched_projects if proj.get("difficulty")))
    
    # Pagination
    total = len(enriched_projects)
    start = (page - 1) * limit
    end = start + limit
    paginated_projects = enriched_projects[start:end]
    
    return {
        "projects": paginated_projects,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
        "filters": {
            "certifications": [{"cert_id": c["cert_id"], "name": c["name"], "vendor": c["vendor"]} for c in certifications],
            "vendors": sorted(vendors),
            "difficulties": sorted(difficulties),
            "technologies": sorted(list(all_technologies))
        }
    }

@api_router.get("/catalog/assessments")
async def get_assessments_catalog(
    request: Request,
    search: Optional[str] = None,
    certification: Optional[str] = None,
    vendor: Optional[str] = None,
    assessment_type: Optional[str] = None,
    domain: Optional[str] = None,
    page: int = 1,
    limit: int = 12
):
    """Get all assessments across all certifications with filters"""
    user = await get_current_user(request)
    
    # Build query filter
    query = {}
    if certification:
        query["cert_id"] = certification
    if assessment_type:
        query["type"] = assessment_type
    if domain:
        query["topics"] = {"$regex": domain, "$options": "i"}
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    # Get all assessments
    all_assessments = await db.assessments.find(query, {"_id": 0, "questions": 0}).to_list(500)
    
    # Get all certifications for mapping and vendor filter
    certifications = await db.certifications.find({}, {"_id": 0}).to_list(100)
    cert_map = {c["cert_id"]: c for c in certifications}
    
    # Filter by vendor if specified
    if vendor:
        all_assessments = [a for a in all_assessments if cert_map.get(a["cert_id"], {}).get("vendor", "").lower() == vendor.lower()]
    
    # Get user progress for status
    user_completed_assessments = set()
    if user:
        progress_list = await db.user_progress.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(100)
        for progress in progress_list:
            for assessment in progress.get("assessments_completed", []):
                user_completed_assessments.add(assessment.get("assessment_id"))
    
    # Enrich assessments with certification info and status
    enriched_assessments = []
    all_topics = set()
    for assess in all_assessments:
        cert = cert_map.get(assess["cert_id"], {})
        assess["certification_name"] = cert.get("name", "Unknown")
        assess["vendor"] = cert.get("vendor", "Unknown")
        assess["status"] = "completed" if assess["assessment_id"] in user_completed_assessments else "not_started"
        assess["is_locked"] = user is None or (user.get("subscription_status") != "premium" and assess.get("type") == "full_exam")
        enriched_assessments.append(assess)
        if assess.get("topics"):
            all_topics.update(assess["topics"])
    
    # Get unique filter options
    vendors = list(set(cert.get("vendor") for cert in certifications))
    types = list(set(a.get("type") for a in enriched_assessments if a.get("type")))
    
    # Pagination
    total = len(enriched_assessments)
    start = (page - 1) * limit
    end = start + limit
    paginated_assessments = enriched_assessments[start:end]
    
    return {
        "assessments": paginated_assessments,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
        "filters": {
            "certifications": [{"cert_id": c["cert_id"], "name": c["name"], "vendor": c["vendor"]} for c in certifications],
            "vendors": sorted(vendors),
            "types": sorted(types),
            "topics": sorted(list(all_topics))
        }
    }



# ============== ADMIN ROUTES ==============

@api_router.get("/admin/dashboard")
async def get_admin_dashboard(admin: Dict = Depends(get_admin)):
    """Get admin dashboard overview statistics"""
    
    # User statistics
    total_users = await db.users.count_documents({})
    active_users_7d = await db.users.count_documents({
        "last_login": {"$gte": (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()}
    })
    suspended_users = await db.users.count_documents({"is_suspended": True})
    premium_users = await db.users.count_documents({"subscription_status": "premium"})
    
    # Role distribution
    role_distribution = {}
    for role in ["learner", "super_admin", "content_admin", "lab_admin", "finance_admin", "support_admin"]:
        count = await db.users.count_documents({"role": role})
        role_distribution[role] = count
    
    # Content statistics
    total_certifications = await db.certifications.count_documents({})
    total_labs = await db.labs.count_documents({})
    total_assessments = await db.assessments.count_documents({})
    total_projects = await db.projects.count_documents({})
    total_videos = await db.videos.count_documents({})
    
    # Progress statistics
    total_progress_records = await db.user_progress.count_documents({})
    avg_readiness_pipeline = [
        {"$group": {"_id": None, "avg_readiness": {"$avg": "$readiness_percentage"}}}
    ]
    avg_readiness_result = await db.user_progress.aggregate(avg_readiness_pipeline).to_list(length=1)
    avg_readiness = avg_readiness_result[0]["avg_readiness"] if avg_readiness_result else 0
    
    # Engagement statistics
    total_discussions = await db.discussions.count_documents({})
    total_certificates = await db.certificates.count_documents({})
    total_badges_earned = await db.user_badges.count_documents({"earned": True})
    
    # Recent activity (last 7 days)
    seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    new_users_7d = await db.users.count_documents({"created_at": {"$gte": seven_days_ago}})
    new_discussions_7d = await db.discussions.count_documents({"created_at": {"$gte": seven_days_ago}})
    
    # Revenue statistics (if finance admin or super admin)
    revenue_stats = {}
    if admin.get("role") in ["super_admin", "finance_admin"]:
        total_transactions = await db.payment_transactions.count_documents({})
        paid_transactions = await db.payment_transactions.count_documents({"payment_status": "paid"})
        
        # Calculate total revenue (assuming $29 monthly, $290 yearly)
        revenue_pipeline = [
            {"$match": {"payment_status": "paid"}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]
        revenue_result = await db.payment_transactions.aggregate(revenue_pipeline).to_list(length=1)
        total_revenue = revenue_result[0]["total"] if revenue_result else 0
        
        revenue_stats = {
            "total_transactions": total_transactions,
            "paid_transactions": paid_transactions,
            "total_revenue": total_revenue,
            "premium_users": premium_users
        }
    
    return {
        "overview": {
            "total_users": total_users,
            "active_users_7d": active_users_7d,
            "suspended_users": suspended_users,
            "premium_users": premium_users,
            "new_users_7d": new_users_7d
        },
        "roles": role_distribution,
        "content": {
            "certifications": total_certifications,
            "labs": total_labs,
            "assessments": total_assessments,
            "projects": total_projects,
            "videos": total_videos
        },
        "learning": {
            "total_enrollments": total_progress_records,
            "avg_readiness_percentage": round(avg_readiness, 2),
            "total_certificates_issued": total_certificates,
            "total_badges_earned": total_badges_earned
        },
        "engagement": {
            "total_discussions": total_discussions,
            "new_discussions_7d": new_discussions_7d
        },
        "revenue": revenue_stats
    }

@api_router.get("/admin/users")
async def get_admin_users(
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[str] = None,  # active, suspended, premium
    admin: Dict = Depends(get_admin)
):
    """Get paginated list of users with filters"""
    
    query = {}
    
    # Search filter
    if search:
        query["$or"] = [
            {"email": {"$regex": search, "$options": "i"}},
            {"name": {"$regex": search, "$options": "i"}},
            {"user_id": {"$regex": search, "$options": "i"}}
        ]
    
    # Role filter
    if role:
        query["role"] = role
    
    # Status filter
    if status == "suspended":
        query["is_suspended"] = True
    elif status == "active":
        query["is_suspended"] = {"$ne": True}
    elif status == "premium":
        query["subscription_status"] = "premium"
    
    # Get total count
    total = await db.users.count_documents(query)
    
    # Get paginated users
    skip = (page - 1) * limit
    users = await db.users.find(query, {"_id": 0}) \
        .sort("created_at", -1) \
        .skip(skip) \
        .limit(limit) \
        .to_list(length=limit)
    
    # Get progress summary for each user
    for user in users:
        progress_count = await db.user_progress.count_documents({"user_id": user["user_id"]})
        user["enrollments_count"] = progress_count
        
        # Get total XP
        xp_pipeline = [
            {"$match": {"user_id": user["user_id"]}},
            {"$group": {"_id": None, "total_xp": {"$sum": "$total_xp"}}}
        ]
        xp_result = await db.user_progress.aggregate(xp_pipeline).to_list(length=1)
        user["total_xp"] = xp_result[0]["total_xp"] if xp_result else 0
    
    return {
        "users": users,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit
    }

@api_router.put("/admin/users/{user_id}/role")
async def assign_user_role(
    user_id: str,
    role_data: AdminRoleAssignment,
    admin: Dict = Depends(get_super_admin)
):
    """Assign role to a user (super admin only)"""
    
    valid_roles = ["learner", "super_admin", "content_admin", "lab_admin", "finance_admin", "support_admin"]
    if role_data.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}")
    
    # Cannot change your own role
    if user_id == admin["user_id"]:
        raise HTTPException(status_code=400, detail="Cannot change your own role")
    
    # Update user role
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"role": role_data.role}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    updated_user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    logger.info(f"Admin {admin['email']} changed role of user {user_id} to {role_data.role}")
    
    return {
        "message": "Role updated successfully",
        "user": updated_user
    }

@api_router.post("/admin/users/{user_id}/suspend")
async def suspend_user(
    user_id: str,
    reason: str,
    admin: Dict = Depends(get_support_or_super_admin)
):
    """Suspend a user account"""
    
    # Cannot suspend yourself
    if user_id == admin["user_id"]:
        raise HTTPException(status_code=400, detail="Cannot suspend your own account")
    
    # Cannot suspend other super admins (unless you're also super admin)
    target_user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if target_user.get("role") == "super_admin" and admin.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Cannot suspend super admin")
    
    # Suspend user
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": {
            "is_suspended": True,
            "suspended_reason": reason,
            "suspended_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Invalidate all user sessions
    await db.user_sessions.delete_many({"user_id": user_id})
    
    logger.info(f"Admin {admin['email']} suspended user {user_id}. Reason: {reason}")
    
    return {
        "message": "User suspended successfully",
        "user_id": user_id,
        "reason": reason
    }

@api_router.post("/admin/users/{user_id}/restore")
async def restore_user(
    user_id: str,
    admin: Dict = Depends(get_support_or_super_admin)
):
    """Restore a suspended user account"""
    
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": {
            "is_suspended": False,
            "suspended_reason": None,
            "suspended_at": None
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    logger.info(f"Admin {admin['email']} restored user {user_id}")
    
    return {
        "message": "User restored successfully",
        "user_id": user_id
    }

@api_router.delete("/admin/users/{user_id}")
async def delete_user(
    user_id: str,
    admin: Dict = Depends(get_super_admin)
):
    """Delete a user account permanently (super admin only)"""
    
    # Cannot delete yourself
    if user_id == admin["user_id"]:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    # Delete user and all related data
    await db.users.delete_one({"user_id": user_id})
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_progress.delete_many({"user_id": user_id})
    await db.user_badges.delete_many({"user_id": user_id})
    await db.bookmarks.delete_many({"user_id": user_id})
    await db.notes.delete_many({"user_id": user_id})
    await db.certificates.delete_many({"user_id": user_id})
    await db.discussions.delete_many({"author_id": user_id})
    await db.payment_transactions.delete_many({"user_id": user_id})
    
    logger.warning(f"Admin {admin['email']} DELETED user {user_id}")
    
    return {
        "message": "User deleted successfully",
        "user_id": user_id
    }

@api_router.get("/admin/analytics/overview")
async def get_admin_analytics(
    days: int = 30,
    admin: Dict = Depends(get_admin)
):
    """Get platform analytics for the specified time period"""
    
    start_date = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    
    # User growth over time
    user_growth_pipeline = [
        {"$match": {"created_at": {"$gte": start_date}}},
        {"$group": {
            "_id": {"$substr": ["$created_at", 0, 10]},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]
    user_growth = await db.users.aggregate(user_growth_pipeline).to_list(length=days)
    
    # Active users over time
    active_users_pipeline = [
        {"$match": {"last_login": {"$gte": start_date}}},
        {"$group": {
            "_id": {"$substr": ["$last_login", 0, 10]},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]
    active_users = await db.user_progress.aggregate(active_users_pipeline).to_list(length=days)
    
    # Content completion rates
    completion_stats = {
        "labs": await db.user_progress.count_documents({"labs_completed.0": {"$exists": True}}),
        "assessments": await db.user_progress.count_documents({"assessments_completed.0": {"$exists": True}}),
        "projects": await db.user_progress.count_documents({"projects_completed.0": {"$exists": True}})
    }
    
    # Top certifications by enrollment
    top_certs_pipeline = [
        {"$group": {"_id": "$cert_id", "enrollments": {"$sum": 1}}},
        {"$sort": {"enrollments": -1}},
        {"$limit": 10}
    ]
    top_certs = await db.user_progress.aggregate(top_certs_pipeline).to_list(length=10)
    
    # Enrich with certification names
    for cert in top_certs:
        cert_doc = await db.certifications.find_one({"cert_id": cert["_id"]}, {"_id": 0, "name": 1, "vendor": 1})
        if cert_doc:
            cert["name"] = cert_doc["name"]
            cert["vendor"] = cert_doc["vendor"]
    
    return {
        "period_days": days,
        "user_growth": user_growth,
        "active_users": active_users,
        "completion_stats": completion_stats,
        "top_certifications": top_certs
    }

@api_router.get("/admin/users/{user_id}/activity")
async def get_user_activity(
    user_id: str,
    admin: Dict = Depends(get_admin)
):
    """Get detailed activity log for a specific user"""
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get all progress records
    progress = await db.user_progress.find({"user_id": user_id}, {"_id": 0}).to_list(length=100)
    
    # Get all certificates
    certificates = await db.certificates.find({"user_id": user_id}, {"_id": 0}).to_list(length=100)
    
    # Get badges
    badges = await db.user_badges.find_one({"user_id": user_id}, {"_id": 0})
    
    # Get discussions
    discussions = await db.discussions.find({"author_id": user_id}, {"_id": 0}).to_list(length=100)
    
    # Get payment transactions (if finance admin or super admin)
    transactions = []
    if admin.get("role") in ["super_admin", "finance_admin"]:
        transactions = await db.payment_transactions.find({"user_id": user_id}, {"_id": 0}).to_list(length=100)
    
    return {
        "user": user,
        "progress": progress,
        "certificates": certificates,
        "badges": badges,
        "discussions": discussions,
        "transactions": transactions
    }

# ============== ADMIN CONTENT MANAGEMENT ==============

# Pydantic models for admin content operations
class AdminCertificationCreate(BaseModel):
    vendor: str
    name: str
    code: str
    difficulty: str
    description: str
    job_roles: List[str] = []
    exam_domains: List[Dict[str, Any]] = []
    image_url: Optional[str] = None
    order: int = 0
    category: Optional[str] = None
    is_published: bool = True

class AdminLabCreate(BaseModel):
    cert_id: str
    title: str
    description: str
    skill_trained: str
    exam_domain: str
    duration_minutes: int
    difficulty: str
    instructions: List[Dict[str, Any]] = []
    prerequisites: List[str] = []
    order: int = 0
    is_published: bool = True

class AdminAssessmentCreate(BaseModel):
    cert_id: str
    title: str
    description: str
    type: str  # domain, full_exam
    topics: List[str] = []
    time_minutes: int
    pass_threshold: int
    questions: List[Dict[str, Any]] = []
    order: int = 0
    is_published: bool = True

class AdminProjectCreate(BaseModel):
    cert_id: str
    title: str
    description: str
    business_scenario: str
    technologies: List[str] = []
    difficulty: str
    skills_validated: List[str] = []
    tasks: List[Dict[str, Any]] = []
    deliverables: List[str] = []
    order: int = 0
    is_published: bool = True

class ContentReorderRequest(BaseModel):
    items: List[Dict[str, Any]]  # [{"id": "...", "order": 0}, ...]


# Admin Content Stats
@api_router.get("/admin/content/stats")
async def get_admin_content_stats(admin: Dict = Depends(get_admin)):
    """Get content statistics for admin dashboard"""
    
    # Count all content
    certs_count = await db.certifications.count_documents({})
    labs_count = await db.labs.count_documents({})
    assessments_count = await db.assessments.count_documents({})
    projects_count = await db.projects.count_documents({})
    videos_count = await db.videos.count_documents({})
    
    # Get content by vendor/category
    certs_by_vendor = {}
    certs = await db.certifications.find({}, {"_id": 0, "vendor": 1}).to_list(100)
    for cert in certs:
        vendor = cert.get("vendor", "Other")
        certs_by_vendor[vendor] = certs_by_vendor.get(vendor, 0) + 1
    
    # Get content usage stats
    total_lab_completions = await db.user_progress.aggregate([
        {"$project": {"labs_count": {"$size": {"$ifNull": ["$labs_completed", []]}}}},
        {"$group": {"_id": None, "total": {"$sum": "$labs_count"}}}
    ]).to_list(1)
    
    total_assessment_completions = await db.user_progress.aggregate([
        {"$project": {"assess_count": {"$size": {"$ifNull": ["$assessments_completed", []]}}}},
        {"$group": {"_id": None, "total": {"$sum": "$assess_count"}}}
    ]).to_list(1)
    
    total_project_completions = await db.user_progress.aggregate([
        {"$project": {"proj_count": {"$size": {"$ifNull": ["$projects_completed", []]}}}},
        {"$group": {"_id": None, "total": {"$sum": "$proj_count"}}}
    ]).to_list(1)
    
    return {
        "counts": {
            "certifications": certs_count,
            "labs": labs_count,
            "assessments": assessments_count,
            "projects": projects_count,
            "videos": videos_count
        },
        "by_vendor": certs_by_vendor,
        "usage": {
            "lab_completions": total_lab_completions[0]["total"] if total_lab_completions else 0,
            "assessment_completions": total_assessment_completions[0]["total"] if total_assessment_completions else 0,
            "project_completions": total_project_completions[0]["total"] if total_project_completions else 0
        }
    }


# ===== CERTIFICATION CRUD =====

@api_router.get("/admin/certifications")
async def admin_list_certifications(admin: Dict = Depends(get_admin)):
    """List all certifications with full details for admin"""
    certs = await db.certifications.find({}, {"_id": 0}).to_list(100)
    
    # Add related content counts
    for cert in certs:
        cert["actual_labs_count"] = await db.labs.count_documents({"cert_id": cert["cert_id"]})
        cert["actual_assessments_count"] = await db.assessments.count_documents({"cert_id": cert["cert_id"]})
        cert["actual_projects_count"] = await db.projects.count_documents({"cert_id": cert["cert_id"]})
        cert["actual_videos_count"] = await db.videos.count_documents({"cert_id": cert["cert_id"]})
    
    return certs

@api_router.post("/admin/certifications")
async def admin_create_certification(data: AdminCertificationCreate, admin: Dict = Depends(get_admin)):
    """Create a new certification"""
    cert_id = f"cert-{uuid.uuid4().hex[:8]}"
    
    certification = {
        "cert_id": cert_id,
        "vendor": data.vendor,
        "name": data.name,
        "code": data.code,
        "difficulty": data.difficulty,
        "description": data.description,
        "job_roles": data.job_roles,
        "exam_domains": data.exam_domains,
        "labs_count": 0,
        "assessments_count": 0,
        "projects_count": 0,
        "image_url": data.image_url,
        "order": data.order,
        "category": data.category,
        "is_published": data.is_published,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": admin["user_id"]
    }
    
    await db.certifications.insert_one(certification)
    logger.info(f"Admin {admin['email']} created certification: {data.name}")
    
    return {"cert_id": cert_id, "message": "Certification created successfully"}

@api_router.put("/admin/certifications/{cert_id}")
async def admin_update_certification(cert_id: str, data: AdminCertificationCreate, admin: Dict = Depends(get_admin)):
    """Update an existing certification"""
    existing = await db.certifications.find_one({"cert_id": cert_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Certification not found")
    
    update_data = {
        "vendor": data.vendor,
        "name": data.name,
        "code": data.code,
        "difficulty": data.difficulty,
        "description": data.description,
        "job_roles": data.job_roles,
        "exam_domains": data.exam_domains,
        "image_url": data.image_url,
        "order": data.order,
        "category": data.category,
        "is_published": data.is_published,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "updated_by": admin["user_id"]
    }
    
    await db.certifications.update_one({"cert_id": cert_id}, {"$set": update_data})
    logger.info(f"Admin {admin['email']} updated certification: {cert_id}")
    
    return {"message": "Certification updated successfully"}

@api_router.delete("/admin/certifications/{cert_id}")
async def admin_delete_certification(cert_id: str, admin: Dict = Depends(get_admin)):
    """Delete a certification and optionally its related content"""
    existing = await db.certifications.find_one({"cert_id": cert_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Certification not found")
    
    # Delete related content
    await db.labs.delete_many({"cert_id": cert_id})
    await db.assessments.delete_many({"cert_id": cert_id})
    await db.projects.delete_many({"cert_id": cert_id})
    await db.videos.delete_many({"cert_id": cert_id})
    await db.discussions.delete_many({"cert_id": cert_id})
    
    # Delete certification
    await db.certifications.delete_one({"cert_id": cert_id})
    
    logger.warning(f"Admin {admin['email']} DELETED certification: {cert_id} and all related content")
    
    return {"message": "Certification and related content deleted successfully"}


# ===== LAB CRUD =====

@api_router.get("/admin/labs")
async def admin_list_labs(
    cert_id: Optional[str] = None,
    admin: Dict = Depends(get_admin)
):
    """List all labs, optionally filtered by certification"""
    query = {}
    if cert_id:
        query["cert_id"] = cert_id
    
    labs = await db.labs.find(query, {"_id": 0}).to_list(500)
    return labs

@api_router.post("/admin/labs")
async def admin_create_lab(data: AdminLabCreate, admin: Dict = Depends(get_admin)):
    """Create a new lab"""
    # Verify certification exists
    cert = await db.certifications.find_one({"cert_id": data.cert_id})
    if not cert:
        raise HTTPException(status_code=404, detail="Certification not found")
    
    lab_id = f"lab-{uuid.uuid4().hex[:8]}"
    
    lab = {
        "lab_id": lab_id,
        "cert_id": data.cert_id,
        "title": data.title,
        "description": data.description,
        "skill_trained": data.skill_trained,
        "exam_domain": data.exam_domain,
        "duration_minutes": data.duration_minutes,
        "difficulty": data.difficulty,
        "instructions": data.instructions,
        "prerequisites": data.prerequisites,
        "order": data.order,
        "is_published": data.is_published,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": admin["user_id"]
    }
    
    await db.labs.insert_one(lab)
    
    # Update certification lab count
    await db.certifications.update_one(
        {"cert_id": data.cert_id},
        {"$inc": {"labs_count": 1}}
    )
    
    logger.info(f"Admin {admin['email']} created lab: {data.title}")
    
    return {"lab_id": lab_id, "message": "Lab created successfully"}

@api_router.put("/admin/labs/{lab_id}")
async def admin_update_lab(lab_id: str, data: AdminLabCreate, admin: Dict = Depends(get_admin)):
    """Update an existing lab"""
    existing = await db.labs.find_one({"lab_id": lab_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Lab not found")
    
    # If cert_id changed, update counts
    old_cert_id = existing.get("cert_id")
    if old_cert_id != data.cert_id:
        await db.certifications.update_one({"cert_id": old_cert_id}, {"$inc": {"labs_count": -1}})
        await db.certifications.update_one({"cert_id": data.cert_id}, {"$inc": {"labs_count": 1}})
    
    update_data = {
        "cert_id": data.cert_id,
        "title": data.title,
        "description": data.description,
        "skill_trained": data.skill_trained,
        "exam_domain": data.exam_domain,
        "duration_minutes": data.duration_minutes,
        "difficulty": data.difficulty,
        "instructions": data.instructions,
        "prerequisites": data.prerequisites,
        "order": data.order,
        "is_published": data.is_published,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "updated_by": admin["user_id"]
    }
    
    await db.labs.update_one({"lab_id": lab_id}, {"$set": update_data})
    logger.info(f"Admin {admin['email']} updated lab: {lab_id}")
    
    return {"message": "Lab updated successfully"}

@api_router.delete("/admin/labs/{lab_id}")
async def admin_delete_lab(lab_id: str, admin: Dict = Depends(get_admin)):
    """Delete a lab"""
    existing = await db.labs.find_one({"lab_id": lab_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Lab not found")
    
    # Update certification lab count
    await db.certifications.update_one(
        {"cert_id": existing["cert_id"]},
        {"$inc": {"labs_count": -1}}
    )
    
    await db.labs.delete_one({"lab_id": lab_id})
    logger.warning(f"Admin {admin['email']} DELETED lab: {lab_id}")
    
    return {"message": "Lab deleted successfully"}


# ===== ASSESSMENT CRUD =====

@api_router.get("/admin/assessments")
async def admin_list_assessments(
    cert_id: Optional[str] = None,
    admin: Dict = Depends(get_admin)
):
    """List all assessments, optionally filtered by certification"""
    query = {}
    if cert_id:
        query["cert_id"] = cert_id
    
    assessments = await db.assessments.find(query, {"_id": 0}).to_list(500)
    return assessments

@api_router.post("/admin/assessments")
async def admin_create_assessment(data: AdminAssessmentCreate, admin: Dict = Depends(get_admin)):
    """Create a new assessment"""
    cert = await db.certifications.find_one({"cert_id": data.cert_id})
    if not cert:
        raise HTTPException(status_code=404, detail="Certification not found")
    
    assessment_id = f"assess-{uuid.uuid4().hex[:8]}"
    
    assessment = {
        "assessment_id": assessment_id,
        "cert_id": data.cert_id,
        "title": data.title,
        "description": data.description,
        "type": data.type,
        "topics": data.topics,
        "time_minutes": data.time_minutes,
        "pass_threshold": data.pass_threshold,
        "questions": data.questions,
        "order": data.order,
        "is_published": data.is_published,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": admin["user_id"]
    }
    
    await db.assessments.insert_one(assessment)
    
    await db.certifications.update_one(
        {"cert_id": data.cert_id},
        {"$inc": {"assessments_count": 1}}
    )
    
    logger.info(f"Admin {admin['email']} created assessment: {data.title}")
    
    return {"assessment_id": assessment_id, "message": "Assessment created successfully"}

@api_router.put("/admin/assessments/{assessment_id}")
async def admin_update_assessment(assessment_id: str, data: AdminAssessmentCreate, admin: Dict = Depends(get_admin)):
    """Update an existing assessment"""
    existing = await db.assessments.find_one({"assessment_id": assessment_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    old_cert_id = existing.get("cert_id")
    if old_cert_id != data.cert_id:
        await db.certifications.update_one({"cert_id": old_cert_id}, {"$inc": {"assessments_count": -1}})
        await db.certifications.update_one({"cert_id": data.cert_id}, {"$inc": {"assessments_count": 1}})
    
    update_data = {
        "cert_id": data.cert_id,
        "title": data.title,
        "description": data.description,
        "type": data.type,
        "topics": data.topics,
        "time_minutes": data.time_minutes,
        "pass_threshold": data.pass_threshold,
        "questions": data.questions,
        "order": data.order,
        "is_published": data.is_published,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "updated_by": admin["user_id"]
    }
    
    await db.assessments.update_one({"assessment_id": assessment_id}, {"$set": update_data})
    logger.info(f"Admin {admin['email']} updated assessment: {assessment_id}")
    
    return {"message": "Assessment updated successfully"}

@api_router.delete("/admin/assessments/{assessment_id}")
async def admin_delete_assessment(assessment_id: str, admin: Dict = Depends(get_admin)):
    """Delete an assessment"""
    existing = await db.assessments.find_one({"assessment_id": assessment_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    await db.certifications.update_one(
        {"cert_id": existing["cert_id"]},
        {"$inc": {"assessments_count": -1}}
    )
    
    await db.assessments.delete_one({"assessment_id": assessment_id})
    logger.warning(f"Admin {admin['email']} DELETED assessment: {assessment_id}")
    
    return {"message": "Assessment deleted successfully"}


# ===== PROJECT CRUD =====

@api_router.get("/admin/projects")
async def admin_list_projects(
    cert_id: Optional[str] = None,
    admin: Dict = Depends(get_admin)
):
    """List all projects, optionally filtered by certification"""
    query = {}
    if cert_id:
        query["cert_id"] = cert_id
    
    projects = await db.projects.find(query, {"_id": 0}).to_list(500)
    return projects

@api_router.post("/admin/projects")
async def admin_create_project(data: AdminProjectCreate, admin: Dict = Depends(get_admin)):
    """Create a new project"""
    cert = await db.certifications.find_one({"cert_id": data.cert_id})
    if not cert:
        raise HTTPException(status_code=404, detail="Certification not found")
    
    project_id = f"proj-{uuid.uuid4().hex[:8]}"
    
    project = {
        "project_id": project_id,
        "cert_id": data.cert_id,
        "title": data.title,
        "description": data.description,
        "business_scenario": data.business_scenario,
        "technologies": data.technologies,
        "difficulty": data.difficulty,
        "skills_validated": data.skills_validated,
        "tasks": data.tasks,
        "deliverables": data.deliverables,
        "order": data.order,
        "is_published": data.is_published,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": admin["user_id"]
    }
    
    await db.projects.insert_one(project)
    
    await db.certifications.update_one(
        {"cert_id": data.cert_id},
        {"$inc": {"projects_count": 1}}
    )
    
    logger.info(f"Admin {admin['email']} created project: {data.title}")
    
    return {"project_id": project_id, "message": "Project created successfully"}

@api_router.put("/admin/projects/{project_id}")
async def admin_update_project(project_id: str, data: AdminProjectCreate, admin: Dict = Depends(get_admin)):
    """Update an existing project"""
    existing = await db.projects.find_one({"project_id": project_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")
    
    old_cert_id = existing.get("cert_id")
    if old_cert_id != data.cert_id:
        await db.certifications.update_one({"cert_id": old_cert_id}, {"$inc": {"projects_count": -1}})
        await db.certifications.update_one({"cert_id": data.cert_id}, {"$inc": {"projects_count": 1}})
    
    update_data = {
        "cert_id": data.cert_id,
        "title": data.title,
        "description": data.description,
        "business_scenario": data.business_scenario,
        "technologies": data.technologies,
        "difficulty": data.difficulty,
        "skills_validated": data.skills_validated,
        "tasks": data.tasks,
        "deliverables": data.deliverables,
        "order": data.order,
        "is_published": data.is_published,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "updated_by": admin["user_id"]
    }
    
    await db.projects.update_one({"project_id": project_id}, {"$set": update_data})
    logger.info(f"Admin {admin['email']} updated project: {project_id}")
    
    return {"message": "Project updated successfully"}

@api_router.delete("/admin/projects/{project_id}")
async def admin_delete_project(project_id: str, admin: Dict = Depends(get_admin)):
    """Delete a project"""
    existing = await db.projects.find_one({"project_id": project_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")
    
    await db.certifications.update_one(
        {"cert_id": existing["cert_id"]},
        {"$inc": {"projects_count": -1}}
    )
    
    await db.projects.delete_one({"project_id": project_id})
    logger.warning(f"Admin {admin['email']} DELETED project: {project_id}")
    
    return {"message": "Project deleted successfully"}


# ===== CONTENT REORDERING =====

@api_router.post("/admin/certifications/reorder")
async def admin_reorder_certifications(data: ContentReorderRequest, admin: Dict = Depends(get_admin)):
    """Reorder certifications"""
    for item in data.items:
        await db.certifications.update_one(
            {"cert_id": item["id"]},
            {"$set": {"order": item["order"]}}
        )
    return {"message": "Certifications reordered successfully"}

@api_router.post("/admin/labs/reorder")
async def admin_reorder_labs(data: ContentReorderRequest, admin: Dict = Depends(get_admin)):
    """Reorder labs within a certification"""
    for item in data.items:
        await db.labs.update_one(
            {"lab_id": item["id"]},
            {"$set": {"order": item["order"]}}
        )
    return {"message": "Labs reordered successfully"}

@api_router.post("/admin/assessments/reorder")
async def admin_reorder_assessments(data: ContentReorderRequest, admin: Dict = Depends(get_admin)):
    """Reorder assessments within a certification"""
    for item in data.items:
        await db.assessments.update_one(
            {"assessment_id": item["id"]},
            {"$set": {"order": item["order"]}}
        )
    return {"message": "Assessments reordered successfully"}

@api_router.post("/admin/projects/reorder")
async def admin_reorder_projects(data: ContentReorderRequest, admin: Dict = Depends(get_admin)):
    """Reorder projects within a certification"""
    for item in data.items:
        await db.projects.update_one(
            {"project_id": item["id"]},
            {"$set": {"order": item["order"]}}
        )
    return {"message": "Projects reordered successfully"}


# ============== LAB ORCHESTRATION ROUTES ==============

# Simulated cloud provider data
CLOUD_PROVIDERS = {
    "aws": {
        "provider_id": "aws",
        "name": "Amazon Web Services",
        "is_enabled": True,
        "regions": ["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1"],
        "resource_types": ["EC2", "Lambda", "S3", "RDS", "EKS"],
        "instance_types": {
            "small": {"vcpu": 2, "memory_gb": 4, "cost_per_hour": 0.05},
            "medium": {"vcpu": 4, "memory_gb": 8, "cost_per_hour": 0.10},
            "large": {"vcpu": 8, "memory_gb": 16, "cost_per_hour": 0.20}
        }
    },
    "gcp": {
        "provider_id": "gcp",
        "name": "Google Cloud Platform",
        "is_enabled": True,
        "regions": ["us-central1", "us-east4", "europe-west1", "asia-east1"],
        "resource_types": ["Compute Engine", "Cloud Functions", "Cloud Storage", "Cloud SQL", "GKE"],
        "instance_types": {
            "small": {"vcpu": 2, "memory_gb": 4, "cost_per_hour": 0.04},
            "medium": {"vcpu": 4, "memory_gb": 8, "cost_per_hour": 0.09},
            "large": {"vcpu": 8, "memory_gb": 16, "cost_per_hour": 0.18}
        }
    },
    "azure": {
        "provider_id": "azure",
        "name": "Microsoft Azure",
        "is_enabled": True,
        "regions": ["eastus", "westus2", "northeurope", "southeastasia"],
        "resource_types": ["Virtual Machines", "Functions", "Blob Storage", "SQL Database", "AKS"],
        "instance_types": {
            "small": {"vcpu": 2, "memory_gb": 4, "cost_per_hour": 0.045},
            "medium": {"vcpu": 4, "memory_gb": 8, "cost_per_hour": 0.095},
            "large": {"vcpu": 8, "memory_gb": 16, "cost_per_hour": 0.19}
        }
    }
}

DEFAULT_QUOTA = {
    "max_concurrent_labs": 2,
    "max_daily_lab_hours": 4.0,
    "max_monthly_lab_hours": 40.0,
    "allowed_providers": ["aws", "gcp", "azure"],
    "allowed_instance_types": ["small", "medium"],
    "storage_limit_gb": 10
}


# === User-facing Lab Instance Routes ===

@api_router.get("/lab-instances")
async def get_user_lab_instances(user: Dict = Depends(require_auth)):
    """Get current user's active lab instances"""
    instances = await db.lab_instances.find(
        {"user_id": user["user_id"], "status": {"$in": ["provisioning", "running", "suspended"]}},
        {"_id": 0}
    ).to_list(100)
    return instances

@api_router.post("/lab-instances")
async def create_lab_instance(data: LabInstanceCreate, user: Dict = Depends(require_auth)):
    """Create a new lab instance for the current user"""
    # Check if lab exists
    lab = await db.labs.find_one({"lab_id": data.lab_id}, {"_id": 0})
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    
    # Get user quota
    quota = await db.resource_quotas.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not quota:
        quota = {**DEFAULT_QUOTA, "user_id": user["user_id"], "current_usage": {}}
    
    # Check concurrent lab limit
    active_instances = await db.lab_instances.count_documents({
        "user_id": user["user_id"],
        "status": {"$in": ["provisioning", "running"]}
    })
    if active_instances >= quota.get("max_concurrent_labs", 2):
        raise HTTPException(status_code=400, detail=f"Maximum concurrent labs ({quota.get('max_concurrent_labs', 2)}) reached")
    
    # Check provider allowed
    if data.provider not in quota.get("allowed_providers", ["aws", "gcp", "azure"]):
        raise HTTPException(status_code=400, detail=f"Provider {data.provider} not allowed for your account")
    
    # Check instance type allowed
    if data.instance_type not in quota.get("allowed_instance_types", ["small", "medium"]):
        raise HTTPException(status_code=400, detail=f"Instance type {data.instance_type} not allowed for your account")
    
    # Get provider config
    provider_config = CLOUD_PROVIDERS.get(data.provider, CLOUD_PROVIDERS["aws"])
    instance_config = provider_config["instance_types"].get(data.instance_type, provider_config["instance_types"]["small"])
    
    # Create instance (simulated)
    instance = {
        "instance_id": f"inst_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "lab_id": data.lab_id,
        "cert_id": lab["cert_id"],
        "provider": data.provider,
        "region": data.region,
        "instance_type": data.instance_type,
        "status": "running",  # Simulated - instant provisioning
        "resources": {
            "vcpu": instance_config["vcpu"],
            "memory_gb": instance_config["memory_gb"],
            "storage_gb": 20,
            "ip_address": f"10.0.{uuid.uuid4().int % 256}.{uuid.uuid4().int % 256}",
            "console_url": f"https://console.skilltrack365.com/lab/{data.lab_id}"
        },
        "started_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat(),
        "cost_estimate": instance_config["cost_per_hour"] * 2,  # 2 hour estimate
        "error_message": None
    }
    
    await db.lab_instances.insert_one(instance)
    del instance["_id"] if "_id" in instance else None
    
    logger.info(f"User {user['email']} started lab instance: {instance['instance_id']} for lab {data.lab_id}")
    
    return instance

@api_router.post("/lab-instances/{instance_id}/action")
async def lab_instance_action(instance_id: str, data: LabInstanceAction, user: Dict = Depends(require_auth)):
    """Perform action on a lab instance (suspend, resume, terminate, extend)"""
    instance = await db.lab_instances.find_one(
        {"instance_id": instance_id, "user_id": user["user_id"]},
        {"_id": 0}
    )
    if not instance:
        raise HTTPException(status_code=404, detail="Lab instance not found")
    
    if data.action == "suspend":
        if instance["status"] != "running":
            raise HTTPException(status_code=400, detail="Can only suspend running instances")
        await db.lab_instances.update_one(
            {"instance_id": instance_id},
            {"$set": {"status": "suspended"}}
        )
        return {"message": "Instance suspended", "status": "suspended"}
    
    elif data.action == "resume":
        if instance["status"] != "suspended":
            raise HTTPException(status_code=400, detail="Can only resume suspended instances")
        await db.lab_instances.update_one(
            {"instance_id": instance_id},
            {"$set": {"status": "running"}}
        )
        return {"message": "Instance resumed", "status": "running"}
    
    elif data.action == "terminate":
        if instance["status"] == "terminated":
            raise HTTPException(status_code=400, detail="Instance already terminated")
        await db.lab_instances.update_one(
            {"instance_id": instance_id},
            {"$set": {
                "status": "terminated",
                "terminated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        return {"message": "Instance terminated", "status": "terminated"}
    
    elif data.action == "extend":
        if instance["status"] not in ["running", "suspended"]:
            raise HTTPException(status_code=400, detail="Cannot extend terminated instances")
        new_expires = datetime.now(timezone.utc) + timedelta(hours=2)
        await db.lab_instances.update_one(
            {"instance_id": instance_id},
            {"$set": {"expires_at": new_expires.isoformat()}}
        )
        return {"message": "Instance extended by 2 hours", "expires_at": new_expires.isoformat()}
    
    else:
        raise HTTPException(status_code=400, detail=f"Unknown action: {data.action}")

@api_router.get("/lab-instances/{instance_id}")
async def get_lab_instance(instance_id: str, user: Dict = Depends(require_auth)):
    """Get details of a specific lab instance"""
    instance = await db.lab_instances.find_one(
        {"instance_id": instance_id, "user_id": user["user_id"]},
        {"_id": 0}
    )
    if not instance:
        raise HTTPException(status_code=404, detail="Lab instance not found")
    return instance

@api_router.get("/my-quota")
async def get_my_quota(user: Dict = Depends(require_auth)):
    """Get current user's resource quota"""
    quota = await db.resource_quotas.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not quota:
        return {**DEFAULT_QUOTA, "user_id": user["user_id"], "current_usage": {}}
    return quota


# === Admin Lab Orchestration Routes ===

@api_router.get("/admin/lab-orchestration/dashboard")
async def admin_lab_dashboard(admin: Dict = Depends(get_admin)):
    """Get lab orchestration dashboard stats"""
    # Count instances by status
    running_count = await db.lab_instances.count_documents({"status": "running"})
    suspended_count = await db.lab_instances.count_documents({"status": "suspended"})
    provisioning_count = await db.lab_instances.count_documents({"status": "provisioning"})
    terminated_today = await db.lab_instances.count_documents({
        "status": "terminated",
        "terminated_at": {"$gte": datetime.now(timezone.utc).replace(hour=0, minute=0, second=0).isoformat()}
    })
    
    # Count by provider
    provider_stats = {}
    for provider in ["aws", "gcp", "azure"]:
        count = await db.lab_instances.count_documents({
            "provider": provider,
            "status": {"$in": ["running", "suspended", "provisioning"]}
        })
        provider_stats[provider] = count
    
    # Calculate total resource usage (simulated)
    total_vcpu = 0
    total_memory = 0
    total_cost = 0.0
    
    active_instances = await db.lab_instances.find(
        {"status": {"$in": ["running", "suspended", "provisioning"]}},
        {"_id": 0}
    ).to_list(1000)
    
    for inst in active_instances:
        resources = inst.get("resources", {})
        total_vcpu += resources.get("vcpu", 0)
        total_memory += resources.get("memory_gb", 0)
        total_cost += inst.get("cost_estimate", 0)
    
    # Users with active labs
    unique_users = len(set(inst["user_id"] for inst in active_instances))
    
    # Recent errors
    error_instances = await db.lab_instances.find(
        {"status": "error"},
        {"_id": 0}
    ).sort("started_at", -1).to_list(5)
    
    return {
        "instances": {
            "running": running_count,
            "suspended": suspended_count,
            "provisioning": provisioning_count,
            "terminated_today": terminated_today
        },
        "providers": provider_stats,
        "resources": {
            "total_vcpu": total_vcpu,
            "total_memory_gb": total_memory,
            "estimated_daily_cost": round(total_cost * 12, 2)  # Rough daily estimate
        },
        "active_users": unique_users,
        "recent_errors": error_instances
    }

@api_router.get("/admin/lab-orchestration/instances")
async def admin_list_instances(
    status: Optional[str] = None,
    provider: Optional[str] = None,
    user_id: Optional[str] = None,
    admin: Dict = Depends(get_admin)
):
    """List all lab instances with optional filters"""
    query = {}
    if status:
        query["status"] = status
    if provider:
        query["provider"] = provider
    if user_id:
        query["user_id"] = user_id
    
    instances = await db.lab_instances.find(query, {"_id": 0}).sort("started_at", -1).to_list(500)
    
    # Enrich with user and lab info
    for inst in instances:
        user = await db.users.find_one({"user_id": inst["user_id"]}, {"_id": 0, "email": 1, "name": 1})
        inst["user"] = user or {"email": "Unknown", "name": "Unknown"}
        lab = await db.labs.find_one({"lab_id": inst["lab_id"]}, {"_id": 0, "title": 1})
        inst["lab_title"] = lab.get("title", "Unknown") if lab else "Unknown"
    
    return instances

@api_router.post("/admin/lab-orchestration/instances/{instance_id}/action")
async def admin_instance_action(instance_id: str, data: LabInstanceAction, admin: Dict = Depends(get_admin)):
    """Admin action on any lab instance"""
    instance = await db.lab_instances.find_one({"instance_id": instance_id}, {"_id": 0})
    if not instance:
        raise HTTPException(status_code=404, detail="Lab instance not found")
    
    if data.action == "suspend":
        await db.lab_instances.update_one(
            {"instance_id": instance_id},
            {"$set": {"status": "suspended"}}
        )
        logger.info(f"Admin {admin['email']} suspended instance {instance_id}")
        return {"message": "Instance suspended by admin", "status": "suspended"}
    
    elif data.action == "resume":
        await db.lab_instances.update_one(
            {"instance_id": instance_id},
            {"$set": {"status": "running"}}
        )
        logger.info(f"Admin {admin['email']} resumed instance {instance_id}")
        return {"message": "Instance resumed by admin", "status": "running"}
    
    elif data.action == "terminate":
        await db.lab_instances.update_one(
            {"instance_id": instance_id},
            {"$set": {
                "status": "terminated",
                "terminated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        logger.info(f"Admin {admin['email']} terminated instance {instance_id}")
        return {"message": "Instance terminated by admin", "status": "terminated"}
    
    elif data.action == "extend":
        new_expires = datetime.now(timezone.utc) + timedelta(hours=4)  # Admin gets 4 hour extension
        await db.lab_instances.update_one(
            {"instance_id": instance_id},
            {"$set": {"expires_at": new_expires.isoformat()}}
        )
        logger.info(f"Admin {admin['email']} extended instance {instance_id}")
        return {"message": "Instance extended by admin (4 hours)", "expires_at": new_expires.isoformat()}
    
    else:
        raise HTTPException(status_code=400, detail=f"Unknown action: {data.action}")


# === Quota Management Routes ===

@api_router.get("/admin/lab-orchestration/quotas")
async def admin_list_quotas(admin: Dict = Depends(get_admin)):
    """List all user quotas"""
    quotas = await db.resource_quotas.find({}, {"_id": 0}).to_list(500)
    
    # Enrich with user info
    for q in quotas:
        user = await db.users.find_one({"user_id": q["user_id"]}, {"_id": 0, "email": 1, "name": 1})
        q["user"] = user or {"email": "Unknown", "name": "Unknown"}
        
        # Calculate current usage
        active_count = await db.lab_instances.count_documents({
            "user_id": q["user_id"],
            "status": {"$in": ["running", "suspended", "provisioning"]}
        })
        q["current_active_labs"] = active_count
    
    return quotas

@api_router.get("/admin/lab-orchestration/quotas/{user_id}")
async def admin_get_user_quota(user_id: str, admin: Dict = Depends(get_admin)):
    """Get quota for a specific user"""
    quota = await db.resource_quotas.find_one({"user_id": user_id}, {"_id": 0})
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not quota:
        quota = {**DEFAULT_QUOTA, "user_id": user_id, "current_usage": {}}
    
    quota["user"] = {"email": user.get("email"), "name": user.get("name")}
    
    # Calculate current usage
    active_count = await db.lab_instances.count_documents({
        "user_id": user_id,
        "status": {"$in": ["running", "suspended", "provisioning"]}
    })
    quota["current_active_labs"] = active_count
    
    return quota

@api_router.put("/admin/lab-orchestration/quotas/{user_id}")
async def admin_update_quota(user_id: str, data: QuotaUpdate, admin: Dict = Depends(get_admin)):
    """Update quota for a specific user"""
    user = await db.users.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    existing = await db.resource_quotas.find_one({"user_id": user_id})
    
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if data.max_concurrent_labs is not None:
        update_data["max_concurrent_labs"] = data.max_concurrent_labs
    if data.max_daily_lab_hours is not None:
        update_data["max_daily_lab_hours"] = data.max_daily_lab_hours
    if data.max_monthly_lab_hours is not None:
        update_data["max_monthly_lab_hours"] = data.max_monthly_lab_hours
    if data.allowed_providers is not None:
        update_data["allowed_providers"] = data.allowed_providers
    if data.allowed_instance_types is not None:
        update_data["allowed_instance_types"] = data.allowed_instance_types
    if data.storage_limit_gb is not None:
        update_data["storage_limit_gb"] = data.storage_limit_gb
    
    if existing:
        await db.resource_quotas.update_one(
            {"user_id": user_id},
            {"$set": update_data}
        )
    else:
        new_quota = {
            **DEFAULT_QUOTA,
            "quota_id": f"quota_{uuid.uuid4().hex[:12]}",
            "user_id": user_id,
            **update_data,
            "current_usage": {}
        }
        await db.resource_quotas.insert_one(new_quota)
    
    logger.info(f"Admin {admin['email']} updated quota for user {user_id}")
    return {"message": "Quota updated successfully"}

@api_router.delete("/admin/lab-orchestration/quotas/{user_id}")
async def admin_reset_quota(user_id: str, admin: Dict = Depends(get_admin)):
    """Reset user quota to defaults"""
    await db.resource_quotas.delete_one({"user_id": user_id})
    logger.info(f"Admin {admin['email']} reset quota for user {user_id} to defaults")
    return {"message": "Quota reset to defaults"}


# === Cloud Provider Management Routes ===

@api_router.get("/admin/lab-orchestration/providers")
async def admin_list_providers(admin: Dict = Depends(get_admin)):
    """List all cloud providers with their configurations"""
    # Check for custom provider settings in DB
    custom_providers = await db.cloud_providers.find({}, {"_id": 0}).to_list(10)
    custom_map = {p["provider_id"]: p for p in custom_providers}
    
    result = []
    for pid, provider in CLOUD_PROVIDERS.items():
        if pid in custom_map:
            # Merge custom settings
            merged = {**provider, **custom_map[pid]}
            result.append(merged)
        else:
            result.append(provider)
    
    return result

@api_router.put("/admin/lab-orchestration/providers/{provider_id}")
async def admin_update_provider(provider_id: str, is_enabled: bool, admin: Dict = Depends(get_admin)):
    """Enable or disable a cloud provider"""
    if provider_id not in CLOUD_PROVIDERS:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    await db.cloud_providers.update_one(
        {"provider_id": provider_id},
        {"$set": {"is_enabled": is_enabled, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    
    status = "enabled" if is_enabled else "disabled"
    logger.info(f"Admin {admin['email']} {status} provider {provider_id}")
    return {"message": f"Provider {provider_id} {status}"}


# === Resource Monitoring Routes ===

@api_router.get("/admin/lab-orchestration/metrics")
async def admin_get_metrics(period: str = "24h", admin: Dict = Depends(get_admin)):
    """Get resource usage metrics (simulated)"""
    # Calculate time range
    hours = 24
    if period == "7d":
        hours = 168
    elif period == "30d":
        hours = 720
    
    start_time = datetime.now(timezone.utc) - timedelta(hours=hours)
    
    # Get all instances in the period
    all_instances = await db.lab_instances.find(
        {"started_at": {"$gte": start_time.isoformat()}},
        {"_id": 0}
    ).to_list(10000)
    
    # Calculate metrics
    total_instances = len(all_instances)
    total_hours = sum(
        2 for inst in all_instances  # Each lab session is ~2 hours
    )
    
    # Provider breakdown
    provider_usage = {}
    for provider in ["aws", "gcp", "azure"]:
        count = len([i for i in all_instances if i.get("provider") == provider])
        provider_usage[provider] = count
    
    # Cost estimation
    total_cost = sum(inst.get("cost_estimate", 0.1) for inst in all_instances)
    
    # Hourly breakdown (simulated)
    hourly_data = []
    for h in range(min(24, hours)):
        hour_time = datetime.now(timezone.utc) - timedelta(hours=h)
        hourly_data.append({
            "hour": hour_time.isoformat(),
            "instances": max(0, total_instances // 24 + (1 if h < total_instances % 24 else 0)),
            "cost": round(total_cost / 24, 2)
        })
    
    return {
        "period": period,
        "total_instances": total_instances,
        "total_lab_hours": total_hours,
        "estimated_cost": round(total_cost, 2),
        "provider_usage": provider_usage,
        "hourly_breakdown": hourly_data[::-1]  # Oldest first
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
