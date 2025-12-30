import requests
import sys
import json
from datetime import datetime

class SkillTrack365APITester:
    def __init__(self, base_url="https://certlab-track.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
            self.failed_tests.append({"test": name, "error": details})

    def test_api_health(self):
        """Test basic API connectivity"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Message: {data.get('message', 'N/A')}"
            self.log_test("API Health Check", success, details)
            return success
        except Exception as e:
            self.log_test("API Health Check", False, str(e))
            return False

    def test_seed_data(self):
        """Test data seeding endpoint"""
        try:
            response = requests.post(f"{self.api_url}/seed", timeout=30)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Message: {data.get('message', 'N/A')}"
            self.log_test("Seed Data", success, details)
            return success
        except Exception as e:
            self.log_test("Seed Data", False, str(e))
            return False

    def test_get_certifications(self):
        """Test getting certifications list"""
        try:
            response = requests.get(f"{self.api_url}/certifications", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Count: {len(data)} certifications"
                # Verify structure
                if data and isinstance(data, list):
                    cert = data[0]
                    required_fields = ['cert_id', 'vendor', 'name', 'code', 'difficulty']
                    missing_fields = [field for field in required_fields if field not in cert]
                    if missing_fields:
                        success = False
                        details += f", Missing fields: {missing_fields}"
            self.log_test("Get Certifications", success, details)
            return success, data if success else []
        except Exception as e:
            self.log_test("Get Certifications", False, str(e))
            return False, []

    def test_get_certification_detail(self, cert_id):
        """Test getting specific certification details"""
        try:
            response = requests.get(f"{self.api_url}/certifications/{cert_id}", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Cert: {data.get('name', 'N/A')}"
            self.log_test(f"Get Certification Detail ({cert_id})", success, details)
            return success
        except Exception as e:
            self.log_test(f"Get Certification Detail ({cert_id})", False, str(e))
            return False

    def test_get_labs(self, cert_id):
        """Test getting labs for a certification"""
        try:
            response = requests.get(f"{self.api_url}/certifications/{cert_id}/labs", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Labs count: {len(data)}"
            self.log_test(f"Get Labs ({cert_id})", success, details)
            return success, data if success else []
        except Exception as e:
            self.log_test(f"Get Labs ({cert_id})", False, str(e))
            return False, []

    def test_get_assessments(self, cert_id):
        """Test getting assessments for a certification"""
        try:
            response = requests.get(f"{self.api_url}/certifications/{cert_id}/assessments", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Assessments count: {len(data)}"
            self.log_test(f"Get Assessments ({cert_id})", success, details)
            return success, data if success else []
        except Exception as e:
            self.log_test(f"Get Assessments ({cert_id})", False, str(e))
            return False, []

    def test_get_projects(self, cert_id):
        """Test getting projects for a certification"""
        try:
            response = requests.get(f"{self.api_url}/certifications/{cert_id}/projects", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Projects count: {len(data)}"
            self.log_test(f"Get Projects ({cert_id})", success, details)
            return success, data if success else []
        except Exception as e:
            self.log_test(f"Get Projects ({cert_id})", False, str(e))
            return False, []

    def test_auth_endpoints_without_auth(self):
        """Test auth-protected endpoints without authentication"""
        endpoints = [
            ("/auth/me", "GET"),
            ("/dashboard", "GET"),
            ("/labs/complete", "POST"),
            ("/assessments/submit", "POST"),
            ("/projects/complete", "POST"),
            ("/bookmarks", "GET"),
            ("/notes/lab-test-1", "GET"),
            ("/certificates", "GET"),
            ("/certificates/generate", "POST")
        ]
        
        for endpoint, method in endpoints:
            try:
                if method == "GET":
                    response = requests.get(f"{self.api_url}{endpoint}", timeout=10)
                else:
                    response = requests.post(f"{self.api_url}{endpoint}", json={}, timeout=10)
                
                success = response.status_code == 401
                details = f"Status: {response.status_code} (Expected: 401)"
                self.log_test(f"Auth Protection - {endpoint}", success, details)
            except Exception as e:
                self.log_test(f"Auth Protection - {endpoint}", False, str(e))

    def test_assessment_review_endpoint(self, assessment_id):
        """Test assessment review endpoint without auth"""
        try:
            response = requests.get(f"{self.api_url}/assessments/{assessment_id}/review", timeout=10)
            success = response.status_code == 401
            details = f"Status: {response.status_code} (Expected: 401)"
            self.log_test(f"Assessment Review Protection ({assessment_id})", success, details)
            return success
        except Exception as e:
            self.log_test(f"Assessment Review Protection ({assessment_id})", False, str(e))
            return False

    def test_certificate_download_endpoint(self):
        """Test certificate download endpoint without auth"""
        try:
            response = requests.get(f"{self.api_url}/certificates/test-cert-id/download", timeout=10)
            success = response.status_code == 401
            details = f"Status: {response.status_code} (Expected: 401)"
            self.log_test("Certificate Download Protection", success, details)
            return success
        except Exception as e:
            self.log_test("Certificate Download Protection", False, str(e))
            return False

    def test_seed_videos(self):
        """Test video content seeding endpoint"""
        try:
            response = requests.post(f"{self.api_url}/seed-videos", timeout=30)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Message: {data.get('message', 'N/A')}"
            self.log_test("Seed Videos", success, details)
            return success
        except Exception as e:
            self.log_test("Seed Videos", False, str(e))
            return False

    def test_leaderboard_api(self):
        """Test leaderboard API endpoints"""
        # Test GET /api/leaderboard
        try:
            response = requests.get(f"{self.api_url}/leaderboard", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                if isinstance(data, list):
                    details += f", Users count: {len(data)}"
                    # Verify structure of leaderboard entries
                    if data:
                        user = data[0]
                        required_fields = ['user_id', 'name', 'xp', 'rank']
                        missing_fields = [field for field in required_fields if field not in user]
                        if missing_fields:
                            success = False
                            details += f", Missing fields: {missing_fields}"
                        else:
                            details += f", Top user: {user.get('name', 'N/A')} (XP: {user.get('xp', 0)})"
                else:
                    success = False
                    details += ", Expected array response"
            self.log_test("Leaderboard API - GET /leaderboard", success, details)
            return success
        except Exception as e:
            self.log_test("Leaderboard API - GET /leaderboard", False, str(e))
            return False

    def test_leaderboard_me_api(self):
        """Test leaderboard me API endpoint (requires auth)"""
        try:
            response = requests.get(f"{self.api_url}/leaderboard/me", timeout=10)
            success = response.status_code == 401  # Should require auth
            details = f"Status: {response.status_code} (Expected: 401 without auth)"
            self.log_test("Leaderboard API - GET /leaderboard/me (auth protection)", success, details)
            return success
        except Exception as e:
            self.log_test("Leaderboard API - GET /leaderboard/me (auth protection)", False, str(e))
            return False

    def test_discussions_api(self, cert_id="aws-saa-c03"):
        """Test discussion forums API endpoints"""
        # Test GET /api/discussions/{cert_id}
        try:
            response = requests.get(f"{self.api_url}/discussions/{cert_id}", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                if isinstance(data, dict) and 'posts' in data:
                    posts = data.get('posts', [])
                    details += f", Posts count: {len(posts)}, Total: {data.get('total', 0)}"
                    # Verify structure
                    if posts:
                        post = posts[0]
                        required_fields = ['post_id', 'title', 'content', 'author']
                        missing_fields = [field for field in required_fields if field not in post]
                        if missing_fields:
                            success = False
                            details += f", Missing fields: {missing_fields}"
                else:
                    success = False
                    details += ", Expected object with 'posts' array"
            self.log_test(f"Discussions API - GET /discussions/{cert_id}", success, details)
            return success, data if success else {}
        except Exception as e:
            self.log_test(f"Discussions API - GET /discussions/{cert_id}", False, str(e))
            return False, {}

    def test_discussions_post_api(self):
        """Test creating discussion post (requires auth)"""
        try:
            post_data = {
                "cert_id": "aws-saa-c03",
                "title": "Test Discussion Post",
                "content": "This is a test post content"
            }
            response = requests.post(f"{self.api_url}/discussions", json=post_data, timeout=10)
            success = response.status_code == 401  # Should require auth
            details = f"Status: {response.status_code} (Expected: 401 without auth)"
            self.log_test("Discussions API - POST /discussions (auth protection)", success, details)
            return success
        except Exception as e:
            self.log_test("Discussions API - POST /discussions (auth protection)", False, str(e))
            return False

    def test_discussion_post_detail_api(self, post_id):
        """Test getting single discussion post"""
        try:
            response = requests.get(f"{self.api_url}/discussions/post/{post_id}", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                required_fields = ['post_id', 'title', 'content', 'author', 'replies']
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    success = False
                    details += f", Missing fields: {missing_fields}"
                else:
                    details += f", Post: {data.get('title', 'N/A')}, Replies: {len(data.get('replies', []))}"
            self.log_test(f"Discussions API - GET /discussions/post/{post_id}", success, details)
            return success
        except Exception as e:
            self.log_test(f"Discussions API - GET /discussions/post/{post_id}", False, str(e))
            return False

    def test_discussion_reply_api(self):
        """Test adding reply to discussion (requires auth)"""
        try:
            reply_data = {
                "post_id": "test-post-id",
                "content": "This is a test reply"
            }
            response = requests.post(f"{self.api_url}/discussions/reply", json=reply_data, timeout=10)
            success = response.status_code == 401  # Should require auth
            details = f"Status: {response.status_code} (Expected: 401 without auth)"
            self.log_test("Discussions API - POST /discussions/reply (auth protection)", success, details)
            return success
        except Exception as e:
            self.log_test("Discussions API - POST /discussions/reply (auth protection)", False, str(e))
            return False

    def test_discussion_like_api(self):
        """Test liking discussion post (requires auth)"""
        try:
            response = requests.post(f"{self.api_url}/discussions/test-post-id/like", timeout=10)
            success = response.status_code == 401  # Should require auth
            details = f"Status: {response.status_code} (Expected: 401 without auth)"
            self.log_test("Discussions API - POST /discussions/{post_id}/like (auth protection)", success, details)
            return success
        except Exception as e:
            self.log_test("Discussions API - POST /discussions/{post_id}/like (auth protection)", False, str(e))
            return False

    def test_videos_api(self, cert_id="aws-saa-c03"):
        """Test video content API endpoints"""
        # Test GET /api/videos/{cert_id}
        try:
            response = requests.get(f"{self.api_url}/videos/{cert_id}", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                if isinstance(data, list):
                    details += f", Videos count: {len(data)}"
                    # Verify structure
                    if data:
                        video = data[0]
                        required_fields = ['video_id', 'title', 'description', 'youtube_url', 'duration_minutes']
                        missing_fields = [field for field in required_fields if field not in video]
                        if missing_fields:
                            success = False
                            details += f", Missing fields: {missing_fields}"
                        else:
                            details += f", First video: {video.get('title', 'N/A')}"
                else:
                    success = False
                    details += ", Expected array response"
            self.log_test(f"Videos API - GET /videos/{cert_id}", success, details)
            return success, data if success else []
        except Exception as e:
            self.log_test(f"Videos API - GET /videos/{cert_id}", False, str(e))
            return False, []

    def test_video_watch_api(self, video_id):
        """Test getting single video details"""
        try:
            response = requests.get(f"{self.api_url}/videos/watch/{video_id}", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                required_fields = ['video_id', 'title', 'description', 'youtube_url']
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    success = False
                    details += f", Missing fields: {missing_fields}"
                else:
                    details += f", Video: {data.get('title', 'N/A')}"
            self.log_test(f"Videos API - GET /videos/watch/{video_id}", success, details)
            return success
        except Exception as e:
            self.log_test(f"Videos API - GET /videos/watch/{video_id}", False, str(e))
            return False

    def test_video_complete_api(self):
        """Test marking video as complete (requires auth)"""
        try:
            response = requests.post(f"{self.api_url}/videos/test-video-id/complete", timeout=10)
            success = response.status_code == 401  # Should require auth
            details = f"Status: {response.status_code} (Expected: 401 without auth)"
            self.log_test("Videos API - POST /videos/{video_id}/complete (auth protection)", success, details)
            return success
        except Exception as e:
            self.log_test("Videos API - POST /videos/{video_id}/complete (auth protection)", False, str(e))
            return False

    def test_video_progress_api(self, cert_id="aws-saa-c03"):
        """Test getting video progress (requires auth)"""
        try:
            response = requests.get(f"{self.api_url}/videos/{cert_id}/progress", timeout=10)
            success = response.status_code == 401  # Should require auth
            details = f"Status: {response.status_code} (Expected: 401 without auth)"
            self.log_test(f"Videos API - GET /videos/{cert_id}/progress (auth protection)", success, details)
            return success
        except Exception as e:
            self.log_test(f"Videos API - GET /videos/{cert_id}/progress (auth protection)", False, str(e))
            return False

    # ============== NEW ENHANCEMENT API TESTS ==============

    def test_smart_recommendations_api(self, cert_id="aws-saa-c03"):
        """Test smart recommendations API (requires auth)"""
        try:
            response = requests.get(f"{self.api_url}/recommendations/{cert_id}", timeout=10)
            success = response.status_code == 401  # Should require auth
            details = f"Status: {response.status_code} (Expected: 401 without auth)"
            self.log_test(f"Smart Recommendations API - GET /recommendations/{cert_id} (auth protection)", success, details)
            return success
        except Exception as e:
            self.log_test(f"Smart Recommendations API - GET /recommendations/{cert_id} (auth protection)", False, str(e))
            return False

    def test_certification_roadmap_api(self, cert_id="aws-saa-c03"):
        """Test certification roadmap API"""
        try:
            response = requests.get(f"{self.api_url}/roadmap/{cert_id}", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                required_fields = ['certification', 'stages', 'overall_progress']
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    success = False
                    details += f", Missing fields: {missing_fields}"
                else:
                    stages = data.get('stages', [])
                    details += f", Stages count: {len(stages)}, Progress: {data.get('overall_progress', 0)}%"
                    # Verify stage structure
                    if stages:
                        stage = stages[0]
                        stage_fields = ['stage', 'title', 'description', 'type', 'completed']
                        missing_stage_fields = [field for field in stage_fields if field not in stage]
                        if missing_stage_fields:
                            success = False
                            details += f", Missing stage fields: {missing_stage_fields}"
            self.log_test(f"Certification Roadmap API - GET /roadmap/{cert_id}", success, details)
            return success
        except Exception as e:
            self.log_test(f"Certification Roadmap API - GET /roadmap/{cert_id}", False, str(e))
            return False

    def test_achievement_badges_api(self):
        """Test achievement badges API (requires auth)"""
        try:
            response = requests.get(f"{self.api_url}/badges", timeout=10)
            success = response.status_code == 401  # Should require auth
            details = f"Status: {response.status_code} (Expected: 401 without auth)"
            self.log_test("Achievement Badges API - GET /badges (auth protection)", success, details)
            return success
        except Exception as e:
            self.log_test("Achievement Badges API - GET /badges (auth protection)", False, str(e))
            return False

    def test_certification_leaderboard_api(self, cert_id="aws-saa-c03"):
        """Test certification-specific leaderboard API"""
        try:
            response = requests.get(f"{self.api_url}/leaderboard/certification/{cert_id}", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                required_fields = ['certification', 'leaderboard', 'total_learners']
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    success = False
                    details += f", Missing fields: {missing_fields}"
                else:
                    leaderboard = data.get('leaderboard', [])
                    details += f", Learners count: {len(leaderboard)}, Total: {data.get('total_learners', 0)}"
                    # Verify leaderboard entry structure
                    if leaderboard:
                        entry = leaderboard[0]
                        entry_fields = ['user_id', 'name', 'xp', 'rank']
                        missing_entry_fields = [field for field in entry_fields if field not in entry]
                        if missing_entry_fields:
                            success = False
                            details += f", Missing entry fields: {missing_entry_fields}"
                        else:
                            details += f", Top learner: {entry.get('name', 'N/A')} (XP: {entry.get('xp', 0)})"
            self.log_test(f"Certification Leaderboard API - GET /leaderboard/certification/{cert_id}", success, details)
            return success
        except Exception as e:
            self.log_test(f"Certification Leaderboard API - GET /leaderboard/certification/{cert_id}", False, str(e))
            return False

    def test_profile_settings_api(self):
        """Test profile settings API (requires auth)"""
        # Test GET /api/profile/settings
        try:
            response = requests.get(f"{self.api_url}/profile/settings", timeout=10)
            success = response.status_code == 401  # Should require auth
            details = f"Status: {response.status_code} (Expected: 401 without auth)"
            self.log_test("Profile Settings API - GET /profile/settings (auth protection)", success, details)
        except Exception as e:
            self.log_test("Profile Settings API - GET /profile/settings (auth protection)", False, str(e))
            success = False

        # Test PUT /api/profile/settings
        try:
            settings_data = {"is_public": True}
            response = requests.put(f"{self.api_url}/profile/settings", json=settings_data, timeout=10)
            success_put = response.status_code == 401  # Should require auth
            details_put = f"Status: {response.status_code} (Expected: 401 without auth)"
            self.log_test("Profile Settings API - PUT /profile/settings (auth protection)", success_put, details_put)
            return success and success_put
        except Exception as e:
            self.log_test("Profile Settings API - PUT /profile/settings (auth protection)", False, str(e))
            return False

    def test_public_profile_api(self, user_id="test-user-id"):
        """Test public profile API"""
        try:
            response = requests.get(f"{self.api_url}/profile/public/{user_id}", timeout=10)
            # This should return 404 for non-existent user or 403 if profile is private
            success = response.status_code in [404, 403]
            details = f"Status: {response.status_code} (Expected: 404 for non-existent user or 403 for private profile)"
            self.log_test(f"Public Profile API - GET /profile/public/{user_id}", success, details)
            return success
        except Exception as e:
            self.log_test(f"Public Profile API - GET /profile/public/{user_id}", False, str(e))
            return False

    def test_discussion_upvote_api(self, post_id="test-post-id"):
        """Test discussion upvote API (requires auth)"""
        try:
            response = requests.post(f"{self.api_url}/discussions/{post_id}/upvote", timeout=10)
            success = response.status_code == 401  # Should require auth
            details = f"Status: {response.status_code} (Expected: 401 without auth)"
            self.log_test(f"Discussion Upvote API - POST /discussions/{post_id}/upvote (auth protection)", success, details)
            return success
        except Exception as e:
            self.log_test(f"Discussion Upvote API - POST /discussions/{post_id}/upvote (auth protection)", False, str(e))
            return False

    def test_discussion_best_answer_api(self, reply_id="test-reply-id"):
        """Test discussion best answer API (requires auth)"""
        try:
            response = requests.post(f"{self.api_url}/discussions/reply/{reply_id}/best", timeout=10)
            success = response.status_code == 401  # Should require auth
            details = f"Status: {response.status_code} (Expected: 401 without auth)"
            self.log_test(f"Discussion Best Answer API - POST /discussions/reply/{reply_id}/best (auth protection)", success, details)
            return success
        except Exception as e:
            self.log_test(f"Discussion Best Answer API - POST /discussions/reply/{reply_id}/best (auth protection)", False, str(e))
            return False

    def test_engagement_status_api(self):
        """Test engagement status API (requires auth)"""
        try:
            response = requests.get(f"{self.api_url}/engagement/status", timeout=10)
            success = response.status_code == 401  # Should require auth
            details = f"Status: {response.status_code} (Expected: 401 without auth)"
            self.log_test("Engagement Status API - GET /engagement/status (auth protection)", success, details)
            return success
        except Exception as e:
            self.log_test("Engagement Status API - GET /engagement/status (auth protection)", False, str(e))
            return False

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting SkillTrack365 Backend API Tests")
        print("=" * 50)
        
        # Basic connectivity
        if not self.test_api_health():
            print("❌ API is not accessible. Stopping tests.")
            return self.get_summary()
        
        # Seed data
        self.test_seed_data()
        
        # Seed video content
        self.test_seed_videos()
        
        # Test public endpoints
        success, certifications = self.test_get_certifications()
        
        if success and certifications:
            # Test with first certification
            cert_id = certifications[0]['cert_id']
            self.test_get_certification_detail(cert_id)
            success_labs, labs = self.test_get_labs(cert_id)
            success_assessments, assessments = self.test_get_assessments(cert_id)
            self.test_get_projects(cert_id)
        
        # Test NEW FEATURES - Leaderboard API
        print("\n🆕 Testing NEW FEATURES - Leaderboard API")
        self.test_leaderboard_api()
        self.test_leaderboard_me_api()
        
        # Test NEW FEATURES - Discussion Forums API
        print("\n🆕 Testing NEW FEATURES - Discussion Forums API")
        success_discussions, discussions_data = self.test_discussions_api("aws-saa-c03")
        self.test_discussions_post_api()
        self.test_discussion_reply_api()
        self.test_discussion_like_api()
        
        # Test discussion post detail if we have posts
        if success_discussions and discussions_data.get('posts'):
            post_id = discussions_data['posts'][0].get('post_id')
            if post_id:
                self.test_discussion_post_detail_api(post_id)
        
        # Test NEW FEATURES - Video Content API
        print("\n🆕 Testing NEW FEATURES - Video Content API")
        success_videos, videos_data = self.test_videos_api("aws-saa-c03")
        self.test_video_complete_api()
        self.test_video_progress_api("aws-saa-c03")
        
        # Test video watch detail if we have videos
        if success_videos and videos_data:
            video_id = videos_data[0].get('video_id')
            if video_id:
                self.test_video_watch_api(video_id)
        
        # Test NEW ENHANCEMENT FEATURES
        print("\n🚀 Testing NEW ENHANCEMENT FEATURES")
        
        # Smart Recommendations API
        print("Testing Smart Recommendations API...")
        self.test_smart_recommendations_api("aws-saa-c03")
        
        # Certification Roadmap API
        print("Testing Certification Roadmap API...")
        self.test_certification_roadmap_api("aws-saa-c03")
        
        # Achievement Badges API
        print("Testing Achievement Badges API...")
        self.test_achievement_badges_api()
        
        # Certification-Specific Leaderboard API
        print("Testing Certification-Specific Leaderboard API...")
        self.test_certification_leaderboard_api("aws-saa-c03")
        
        # Public Profile APIs
        print("Testing Public Profile APIs...")
        self.test_profile_settings_api()
        self.test_public_profile_api("test-user-id")
        
        # Discussion Upgrades
        print("Testing Discussion Upgrades...")
        self.test_discussion_upvote_api("test-post-id")
        self.test_discussion_best_answer_api("test-reply-id")
        
        # Engagement Status API
        print("Testing Engagement Status API...")
        self.test_engagement_status_api()
        
        # Test auth protection
        print("\n🔒 Testing Authentication Protection")
        self.test_auth_endpoints_without_auth()
        
        # Test existing feature endpoints
        if success and success_assessments and assessments:
            assessment_id = assessments[0]['assessment_id']
            self.test_assessment_review_endpoint(assessment_id)
        
        self.test_certificate_download_endpoint()
        
        return self.get_summary()

    def get_summary(self):
        """Get test summary"""
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"  - {test['test']}: {test['error']}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"\n✨ Success Rate: {success_rate:.1f}%")
        
        return {
            "tests_run": self.tests_run,
            "tests_passed": self.tests_passed,
            "success_rate": success_rate,
            "failed_tests": self.failed_tests
        }

def main():
    tester = SkillTrack365APITester()
    summary = tester.run_all_tests()
    
    # Return appropriate exit code
    return 0 if summary["success_rate"] >= 80 else 1

if __name__ == "__main__":
    sys.exit(main())