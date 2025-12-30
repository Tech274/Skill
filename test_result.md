# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication between agents"

#====================================================================================================
# Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# Protocol Guidelines for Main Agent:
# 1. Update Test Results:
#    - Update the working status of tasks in the appropriate section (backend/frontend)
#    - Add detailed comments about test results in status_history
#    - Track test attempts in stuck_count for persistent issues
#    - Mark needs_retesting: true for tasks that need verification
#
# 2. Incorporate User Feedback:
#    - When user reports issues with a working task, add their feedback to status_history
#    - Update working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  Build SkillTrack365 - a Certification-First, Hands-On Learning SaaS platform.
  Features include: Certification Hub, Cloud Labs, Assessments, Projects, Dashboard,
  PDF Certificates, Assessment Review, Lab Bookmarks/Notes, Leaderboard, Discussion Forums,
  Video Content, and Social Sharing.

backend:
  - task: "Health Check API"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "Verified in iteration 2"

  - task: "Authentication (Session, Me, Logout)"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "Google OAuth + session management working"

  - task: "Certifications CRUD"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "List and get certification endpoints working"

  - task: "Labs (list, get, complete)"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "Lab endpoints functional"

  - task: "Assessments (list, get, submit)"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "Assessment submission and scoring working"

  - task: "Projects (list, get, complete)"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "Project endpoints functional"

  - task: "Dashboard"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "Dashboard aggregates user progress correctly"

  - task: "Stripe Checkout"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "Stripe integration working"

  - task: "PDF Certificate Generation"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "PDF generation and download working"

  - task: "Assessment Review"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "Review mode shows questions and user answers"

  - task: "Lab Bookmarks"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "Bookmark toggle working"

  - task: "Lab Notes"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "Notes save and retrieve working"

  - task: "Leaderboard"
    implemented: true
    working: NA
    file: "server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: NA
        agent: "main"
        comment: "New feature - needs testing. GET /api/leaderboard and GET /api/leaderboard/me endpoints implemented"

  - task: "Discussion Forums"
    implemented: true
    working: NA
    file: "server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: NA
        agent: "main"
        comment: "New feature - needs testing. Endpoints: GET/POST /api/discussions, GET /api/discussions/post/{id}, POST /api/discussions/reply, POST /api/discussions/{id}/like"

  - task: "Video Content"
    implemented: true
    working: NA
    file: "server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: NA
        agent: "main"
        comment: "New feature - needs testing. Endpoints: GET /api/videos/{cert_id}, GET /api/videos/watch/{video_id}, POST /api/videos/{id}/complete, GET /api/videos/{cert_id}/progress"

frontend:
  - task: "Landing Page"
    implemented: true
    working: true
    file: "pages/Landing.jsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false

  - task: "Login Page"
    implemented: true
    working: true
    file: "pages/Login.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false

  - task: "Certification Hub"
    implemented: true
    working: true
    file: "pages/CertificationHub.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false

  - task: "Certification Path"
    implemented: true
    working: true
    file: "pages/CertificationPath.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false

  - task: "Cloud Labs"
    implemented: true
    working: true
    file: "pages/CloudLabs.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false

  - task: "Active Lab (with simulated console)"
    implemented: true
    working: true
    file: "pages/ActiveLab.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false

  - task: "Assessments"
    implemented: true
    working: true
    file: "pages/Assessments.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false

  - task: "Assessment Take"
    implemented: true
    working: true
    file: "pages/AssessmentTake.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false

  - task: "Assessment Results"
    implemented: true
    working: true
    file: "pages/AssessmentResults.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false

  - task: "Assessment Review"
    implemented: true
    working: true
    file: "pages/AssessmentReview.jsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false

  - task: "Projects"
    implemented: true
    working: true
    file: "pages/Projects.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false

  - task: "Project Workspace"
    implemented: true
    working: true
    file: "pages/ProjectWorkspace.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false

  - task: "Dashboard"
    implemented: true
    working: true
    file: "pages/Dashboard.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false

  - task: "Checkout"
    implemented: true
    working: true
    file: "pages/Checkout.jsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false

  - task: "Profile"
    implemented: true
    working: true
    file: "pages/Profile.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false

  - task: "Certificate View"
    implemented: true
    working: true
    file: "pages/CertificateView.jsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false

  - task: "Leaderboard Page"
    implemented: true
    working: NA
    file: "pages/Leaderboard.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: NA
        agent: "main"
        comment: "New feature - needs testing. Shows top learners, XP rewards, and user rank"

  - task: "Discussions Page"
    implemented: true
    working: NA
    file: "pages/Discussions.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: NA
        agent: "main"
        comment: "New feature - needs testing. Lists discussions, create new post dialog"

  - task: "Discussion Post Page"
    implemented: true
    working: NA
    file: "pages/DiscussionPost.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: NA
        agent: "main"
        comment: "New feature - needs testing. Single post view with replies"

  - task: "Videos Page"
    implemented: true
    working: NA
    file: "pages/Videos.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: NA
        agent: "main"
        comment: "New feature - needs testing. Video player, list, progress tracking"

metadata:
  created_by: "main_agent"
  version: "3.0"
  test_sequence: 3
  run_ui: true

test_plan:
  current_focus:
    - "Leaderboard"
    - "Discussion Forums"
    - "Video Content"
    - "Leaderboard Page"
    - "Discussions Page"
    - "Discussion Post Page"
    - "Videos Page"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: |
      Testing Agent: Please run comprehensive tests on the NEW features:
      
      BACKEND TESTS NEEDED:
      1. Leaderboard API:
         - GET /api/leaderboard (returns top 20 users by XP)
         - GET /api/leaderboard/me (returns current user rank and stats)
      
      2. Discussion Forums API:
         - GET /api/discussions/{cert_id} (list discussions for certification)
         - GET /api/discussions/post/{post_id} (get single post with replies)
         - POST /api/discussions (create new discussion)
         - POST /api/discussions/reply (add reply to post)
         - POST /api/discussions/{post_id}/like (toggle like on post)
      
      3. Video Content API:
         - GET /api/videos/{cert_id} (list videos for certification)
         - GET /api/videos/watch/{video_id} (get single video details)
         - POST /api/videos/{video_id}/complete (mark video as watched)
         - GET /api/videos/{cert_id}/progress (get user video progress)
         - POST /api/seed-videos (seed video data if needed)
      
      FRONTEND TESTS NEEDED:
      1. Leaderboard Page (/leaderboard):
         - Displays top 3 podium with user avatars
         - Shows user's own rank in highlighted card
         - Lists remaining users with XP and stats
      
      2. Discussions Page (/certification/{certId}/discussions):
         - Lists discussion posts
         - "New Discussion" button opens dialog
         - Create post form submits successfully
         - Click on post navigates to detail page
      
      3. Discussion Post Page (/discussions/post/{postId}):
         - Shows post title, content, author
         - Displays replies
         - Reply form allows adding new replies
         - Like button toggles
      
      4. Videos Page (/certification/{certId}/videos):
         - Lists all videos for certification
         - Video player embeds YouTube
         - "Mark Complete" button works
         - Progress bar shows completion percentage
      
      NOTE: 
      - Data may need to be seeded first using POST /api/seed and POST /api/seed-videos
      - Use cert_id "aws-saa-c03" for testing
      - Authentication is required for most endpoints
