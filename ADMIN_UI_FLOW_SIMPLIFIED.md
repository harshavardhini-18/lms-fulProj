# 👨‍💼 ADMIN UI - SIMPLIFIED MVP VERSION

## 🎯 WHAT WE'RE BUILDING (Simplified)

```
✅ INCLUDED IN MVP:
├─ Admin Dashboard (Overview)
├─ Courses Management (List all courses)
├─ Course Editor (Create/Edit course)
├─ Module Editor (Create/Edit modules)
├─ Lesson Editor (Create/Edit lessons)
├─ Quiz Builder (Create/Edit quizzes)
└─ Video URL Input (Paste links, no upload)

❌ REMOVED FOR NOW (Phase 3):
├─ Analytics Dashboard
├─ Drag-drop reordering
├─ File upload functionality
├─ Advanced UI animations
└─ Responsive mobile layouts
```

---

## 📊 QUICK COMPARISON: Student vs Admin

```
STUDENT UI:                    ADMIN UI (MVP):
═══════════════════════════════════════════════════════════
- View published courses       - View/Edit ALL courses
- Watch videos (read-only)     - Create new courses
- Take quizzes                - Delete courses (soft)
- Track own progress          - Create/Edit/Delete modules
- See completion %            - Create/Edit/Delete lessons
                              - Add video by URL
                              - Create/Manage quizzes
                              - Set course status
```

---

## 🏗️ ADMIN UI LAYOUT (Simplified)

```
┌──────────────────────────────────────────────────────────────┐
│                    ADMIN NAVBAR                              │
│ 🔵 LMS Admin  │ Dashboard │ Courses │ Settings │ Logout ▼  │
└──────────────────────────────────────────────────────────────┘
│                                                              │
│ ┌──────────────────────────────────────────────────────┐    │
│ │                   LEFT SIDEBAR                       │    │
│ │                                                      │    │
│ │  📚 Courses Management                              │    │
│ │    ├─ View All Courses                              │    │
│ │    ├─ Create New Course                             │    │
│ │    └─ My Courses (Created by me)                   │    │
│ │                                                      │    │
│ │  ⚙️ Settings                                         │    │
│ │    ├─ Account                                        │    │
│ │    └─ Profile                                        │    │
│ │                                                      │    │
│ └──────────────────────────────────────────────────────┘    │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐    │
│ │         MAIN CONTENT AREA                            │    │
│ │  (Dashboard / Course List / Editor / etc)           │    │
│ │                                                      │    │
│ │                                                      │    │
│ └──────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎯 PAGE 1: ADMIN DASHBOARD (Simplified)

### Layout:

```
┌─────────────────────────────────────────────────────────────┐
│ ADMIN DASHBOARD                                             │
└─────────────────────────────────────────────────────────────┘
│ Welcome, Admin Harsha! 👋                                    │
│ Last login: Apr 11, 2026 at 2:30 PM                        │
│                                                             │
├─ QUICK STATS ────────────────────────────────────────────┐ │
│                                                          │ │
│  Total Courses: 5     │  Total Students: 120           │ │
│  Published: 3         │  Modules Created: 12           │ │
│  Draft: 2             │  Lessons Created: 45           │ │
│                                                          │ │
└──────────────────────────────────────────────────────────┘ │
│                                                             │
├─ RECENT COURSES ──────────────────────────────────────────┐ │
│                                                          │ │
│  Course Name        │ Status    │ Modules │ Created   │ │
│  ─────────────────────┼───────────┼─────────┼──────────│ │
│  React Fundamentals │ Published │    3    │ Apr 10   │ │
│  Node.js Basics     │ Draft     │    2    │ Apr 9    │ │
│  MongoDB Advanced   │ Published │    4    │ Apr 8    │ │
│                                                          │ │
│  [View All Courses]                                     │ │
│                                                          │ │
└──────────────────────────────────────────────────────────┘ │
│                                                             │
├─ QUICK ACTIONS ──────────────────────────────────────────┐ │
│                                                          │ │
│  [+ Create New Course]   [View All Courses]            │ │
│                                                          │ │
└──────────────────────────────────────────────────────────┘ │
```

---

## 🎯 PAGE 2: COURSES MANAGEMENT (List View)

### Layout:

```
┌─────────────────────────────────────────────────────────────┐
│ COURSES MANAGEMENT                                          │
│ [Search 🔍]        [Status Filter ▼]   [+ New Course]     │
└─────────────────────────────────────────────────────────────┘
│                                                             │
├─ COURSES LIST ────────────────────────────────────────────┐ │
│                                                          │ │
│ Course Name           │ Status    │ Modules │ Actions  │ │
│ ──────────────────────┼───────────┼─────────┼──────────│ │
│ React Fundamentals    │ Published │    3    │ [Edit]   │ │
│                       │           │         │ [View]   │ │
│                       │           │         │ [Delete] │ │
│ ──────────────────────┼───────────┼─────────┼──────────│ │
│ Node.js Basics        │ Draft     │    2    │ [Edit]   │ │
│                       │           │         │ [Delete] │ │
│ ──────────────────────┼───────────┼─────────┼──────────│ │
│ MongoDB Advanced      │ Published │    4    │ [Edit]   │ │
│                       │           │         │ [View]   │ │
│                       │           │         │ [Delete] │ │
│                                                          │ │
└──────────────────────────────────────────────────────────┘ │
│                                                             │
│  Showing 1-3 of 5 courses                   [1] [2] [>]   │
```

### User Interactions:
- **Search** → Filter by course title
- **Status Filter** → Show Published/Draft/All
- **[Edit]** → Open Course Editor
- **[View]** → Preview course as student
- **[Delete]** → Delete course with confirmation
- **[+ New Course]** → Create new course

---

## 🎯 PAGE 3: CREATE/EDIT COURSE

### Layout:

```
┌─────────────────────────────────────────────────────────────┐
│ CREATE NEW COURSE                         [← Back]         │
└─────────────────────────────────────────────────────────────┘
│                                                             │
├─ COURSE INFORMATION ──────────────────────────────────────┐ │
│                                                          │ │
│  Course Title *                                         │ │
│  [___________________________________________________]   │ │
│                                                          │ │
│  Description *                                          │ │
│  [_________________________________________________]     │ │
│  [____________________________________________________]  │ │
│  [Max 500 characters: 0/500]                          │ │
│                                                          │ │
│  Level *                                                │ │
│  [Beginner ▼]                                          │ │
│  Options: Beginner, Intermediate, Advanced            │ │
│                                                          │ │
│  Status *                                               │ │
│  ⭕ Draft    ⭕ Published                             │ │
│                                                          │ │
└──────────────────────────────────────────────────────────┘ │
│                                                             │
├─ COURSE SETTINGS (Optional) ──────────────────────────────┐ │
│                                                          │ │
│  Prerequisites (optional)                               │ │
│  [Select courses...]                                    │ │
│                                                          │ │
│  Passing Score for Course (%)                           │ │
│  [70]                                                   │ │
│                                                          │ │
│  Issue Certificate on Completion                        │ │
│  ☑ Yes     ☐ No                                        │ │
│                                                          │ │
└──────────────────────────────────────────────────────────┘ │
│                                                             │
├─ ACTION BUTTONS ──────────────────────────────────────────┐ │
│                                                          │ │
│  [Save Draft]  [Save & Continue]  [Cancel]             │ │
│                                                          │ │
└──────────────────────────────────────────────────────────┘ │
```

---

## 🎯 PAGE 4: COURSE EDITOR (Main Page)

### Layout:

```
┌─────────────────────────────────────────────────────────────┐
│ EDITING: React Fundamentals                [← Back]        │
│ Status: Draft  │  Created: Apr 10  │  Last Edited: Now    │
└─────────────────────────────────────────────────────────────┘
│                                                             │
│ Course: React Fundamentals  │  [Edit Course Info]          │
│                                                             │
├─ MODULES & LESSONS ───────────────────────────────────────┐ │
│                                                          │ │
│  MODULE 1: Introduction (3 lessons)                    │ │
│  ┌────────────────────────────────────────────────┐   │ │
│  │  LESSON 1.1: What is React?                   │   │ │
│  │  Duration: 10:00  │ Video: ✓  │ Quiz: ✗     │   │ │
│  │  [Edit]  [Delete]  [Move ↓]                    │   │ │
│  │                                                │   │ │
│  │  LESSON 1.2: Setup Environment                │   │ │
│  │  Duration: 15:00  │ Video: ✓  │ Quiz: ✓     │   │ │
│  │  [Edit]  [Delete]  [Move ↑↓]                  │   │ │
│  │                                                │   │ │
│  │  LESSON 1.3: Your First Component             │   │ │
│  │  Duration: 20:00  │ Video: ✓  │ Quiz: ✓     │   │ │
│  │  [Edit]  [Delete]  [Move ↑]                   │   │ │
│  │                                                │   │ │
│  │  [+ Add Lesson to This Module]                 │   │ │
│  └────────────────────────────────────────────────┘   │ │
│  [Edit Module]  [Delete Module]  [Move ↓]             │ │
│                                                          │ │
│  MODULE 2: Components (2 lessons)                      │ │
│  ┌────────────────────────────────────────────────┐   │ │
│  │  (Similar structure...)                        │   │ │
│  └────────────────────────────────────────────────┘   │ │
│  [Edit Module]  [Delete Module]  [Move ↑↓]           │ │
│                                                          │ │
│  [+ Add New Module]                                    │ │
│                                                          │ │
└──────────────────────────────────────────────────────────┘ │
│                                                             │
├─ INFO ────────────────────────────────────────────────────┐ │
│  Total Duration: 45 min │ Modules: 2 │ Lessons: 5       │ │
└──────────────────────────────────────────────────────────┘ │
│                                                             │
├─ ACTIONS ────────────────────────────────────────────────┐ │
│                                                          │ │
│  [← Back]  [Save Changes]  [Publish Course]            │ │
│                                                          │ │
└──────────────────────────────────────────────────────────┘ │
```

### User Interactions:
- **[Edit] on lesson** → Open Lesson Editor
- **[Delete]** → Remove with confirmation
- **[Move ↑↓]** → Manually move using dropdown (no drag-drop)
- **[+ Add Lesson]** → Create new lesson
- **[+ Add Module]** → Create new module
- **[Edit Module]** → Open Module Editor
- **[Save Changes]** → Save all modifications
- **[Publish Course]** → Make visible to students

---

## 🎯 PAGE 5: MODULE EDITOR (Simplified)

### Layout:

```
┌─────────────────────────────────────────────────────────────┐
│ EDIT MODULE: Introduction                  [← Back]        │
└─────────────────────────────────────────────────────────────┘
│                                                             │
├─ MODULE DETAILS ──────────────────────────────────────────┐ │
│                                                          │ │
│  Module Title *                                         │ │
│  [Introduction to React]                               │ │
│                                                          │ │
│  Module Description                                     │ │
│  [In this module, we'll cover...]                      │ │
│                                                          │ │
│  Module Position: 1 of 3                                │ │
│  Move Position: [1 ▼]         [Update Position]       │ │
│                                                          │ │
└──────────────────────────────────────────────────────────┘ │
│                                                             │
├─ LESSONS IN THIS MODULE ──────────────────────────────────┐ │
│                                                          │ │
│  Lesson 1: What is React?                               │ │
│  Duration: 10:00  │  Video: ✓  │  Quiz: ✗             │ │
│  [Edit]  [Delete]  [Change Position: 1 ▼]              │ │
│                                                          │ │
│  Lesson 2: Setup Environment                            │ │
│  Duration: 15:00  │  Video: ✓  │  Quiz: ✓             │ │
│  [Edit]  [Delete]  [Change Position: 2 ▼]              │ │
│                                                          │ │
│  Lesson 3: Your First Component                         │ │
│  Duration: 20:00  │  Video: ✓  │  Quiz: ✓             │ │
│  [Edit]  [Delete]  [Change Position: 3 ▼]              │ │
│                                                          │ │
│  [+ Add New Lesson to This Module]                      │ │
│                                                          │ │
└──────────────────────────────────────────────────────────┘ │
│                                                             │
├─ ACTIONS ────────────────────────────────────────────────┐ │
│                                                          │ │
│  [← Back]  [Save Module]  [Delete Module]              │ │
│                                                          │ │
└──────────────────────────────────────────────────────────┘ │
```

---

## 🎯 PAGE 6: LESSON EDITOR (Core Page)

### Layout:

```
┌─────────────────────────────────────────────────────────────┐
│ EDIT LESSON: What is React?              [← Back]          │
│ Module: Introduction │ Position: 1 of 3                    │
└─────────────────────────────────────────────────────────────┘
│                                                             │
├─ LESSON DETAILS ──────────────────────────────────────────┐ │
│                                                          │ │
│  Lesson Title *                                         │ │
│  [What is React?]                                       │ │
│                                                          │ │
│  Description *                                          │ │
│  [In this lesson, students will learn...]              │ │
│                                                          │ │
│  Learning Outcomes (one per line)                       │ │
│  [Understand React basics]                              │ │
│  [Learn JSX syntax]                                     │ │
│  [+ Add Another Outcome]                                │ │
│                                                          │ │
│  Lesson Duration (minutes) *                            │ │
│  [10]      (Should match video length)                 │ │
│                                                          │ │
└──────────────────────────────────────────────────────────┘ │
│                                                             │
├─ VIDEO (URL INPUT ONLY) ──────────────────────────────────┐ │
│                                                          │ │
│  Video URL *                                            │ │
│  [https://youknow.com/videos/react-basics]            │ │
│                                                          │ │
│  (Paste YouTube, Vimeo, or direct video link)         │ │
│  Supported: .mp4, YouTube, Vimeo                       │ │
│                                                          │ │
│  ┌─ VIDEO PREVIEW ─────────────────────────────────┐   │ │
│  │ ▶️  Reading URL...                              │   │ │
│  │                                                  │   │ │
│  │ [PREVIEW VIDEO - Click to test]                 │   │ │
│  │                                                  │   │ │
│  │ ℹ️ Click preview to verify video works         │   │ │
│  └──────────────────────────────────────────────────┘   │ │
│                                                          │ │
└──────────────────────────────────────────────────────────┘ │
│                                                             │
├─ ATTACHMENTS & RESOURCES ────────────────────────────────┐ │
│                                                          │ │
│  Resource Links (optional)                              │ │
│  + https://react.dev                                    │ │
│  + https://github.com/facebook/react                   │ │
│                                                          │ │
│  [+ Add Resource Link]                                  │ │
│                                                          │ │
└──────────────────────────────────────────────────────────┘ │
│                                                             │
├─ QUIZ ASSIGNMENT ─────────────────────────────────────────┐ │
│                                                          │ │
│  Assign Quiz at End of Lesson (optional)               │ │
│  ☑ Yes     ☐ No                                        │ │
│                                                          │ │
│  Quiz Type:                                             │ │
│  ⭕ Select Existing Quiz                              │ │
│  ⭕ Create New Quiz                                    │ │
│                                                          │ │
│  Select Quiz:                                           │ │
│  [React Basics Quiz ▼]                                 │ │
│                                                          │ │
│  Passing Score (%): [70]                                │ │
│                                                          │ │
│  [Create New Quiz Instead]                              │ │
│                                                          │ │
└──────────────────────────────────────────────────────────┘ │
│                                                             │
├─ SAVE STATUS ─────────────────────────────────────────────┐ │
│                                                          │ │
│  ✅ All changes saved                                   │ │
│                                                          │ │
│  [← Back]  [Save]  [Delete Lesson]                     │ │
│                                                          │ │
└──────────────────────────────────────────────────────────┘ │
```

### Key Simplifications:
- **Video URL only** - Paste links, no file upload
- **Video preview button** - Simple click to test
- **Resource links** - Simple text input
- **No drag-drop** - Use dropdown to change position

---

## 🎯 PAGE 7: QUIZ BUILDER (Simplified)

### Layout:

```
┌─────────────────────────────────────────────────────────────┐
│ CREATE/EDIT QUIZ: React Basics                [← Back]     │
└─────────────────────────────────────────────────────────────┘
│                                                             │
├─ QUIZ SETTINGS ───────────────────────────────────────────┐ │
│                                                          │ │
│  Quiz Title *                                           │ │
│  [React Basics Quiz]                                    │ │
│                                                          │ │
│  Description                                            │ │
│  [Test your understanding of React]                    │ │
│                                                          │ │
│  Passing Score Required (%): [70]                       │ │
│  Max Attempts Allowed: [3]                              │ │
│  Time Limit (minutes): [15]        (0 = No limit)      │ │
│                                                          │ │
│  Show Answers After Quiz Submission: ☑                 │ │
│                                                          │ │
└──────────────────────────────────────────────────────────┘ │
│                                                             │
├─ QUESTIONS ───────────────────────────────────────────────┐ │
│                                                          │ │
│  QUESTION 1:  What is React?                            │ │
│  Type: Multiple Choice (4 options)                      │ │
│  Points: [1]                                            │ │
│                                                          │ │
│  Question Text *                                        │ │
│  [What is React?]                                       │ │
│                                                          │ │
│  Option A:  [Facebook's JS library]  [✓ Correct]      │ │
│  Option B:  [A chemical compound   ]  [ Correct]       │ │
│  Option C:  [A testing framework   ]  [ Correct]       │ │
│  Option D:  [A database system     ]  [ Correct]       │ │
│                                                          │ │
│  [Edit Question]  [Delete]  [Change Position: 1 ▼]    │ │
│                                                          │ │
│  ─────────────────────────────────────────────────────  │ │
│                                                          │ │
│  QUESTION 2:  JSX is HTML in JavaScript                 │ │
│  Type: True/False                                       │ │
│  Points: [1]                                            │ │
│                                                          │ │
│  [✓ True]  [ False]                                     │ │
│                                                          │ │
│  [Edit Question]  [Delete]  [Change Position: 2 ▼]    │ │
│                                                          │ │
│  [+ Add New Question]                                   │ │
│                                                          │ │
└──────────────────────────────────────────────────────────┘ │
│                                                             │
├─ STATISTICS ──────────────────────────────────────────────┐ │
│                                                          │ │
│  Total Questions: 2  │  Total Points: 2                │ │
│                                                          │ │
├─ ACTIONS ────────────────────────────────────────────────┐ │
│                                                          │ │
│  [← Back]  [Save Quiz]  [Delete Quiz]                  │ │
│                                                          │ │
└──────────────────────────────────────────────────────────┘ │
```

---

## 🛠️ REACT COMPONENTS TO BUILD

### Simplified Component Structure:

```
src/
├── pages/
│   ├── AdminDashboard.jsx           ← Landing page
│   ├── AdminCoursesManagement.jsx   ← List all courses
│   ├── AdminCourseEditor.jsx        ← Main course edit
│   ├── AdminModuleEditor.jsx        ← Edit module
│   ├── AdminLessonEditor.jsx        ← Edit lesson
│   └── AdminQuizBuilder.jsx         ← Create/edit quiz
│
├── components/
│   ├── admin/
│   │   ├── CourseCard.jsx           ← Simple display card
│   │   ├── ModuleList.jsx           ← List modules
│   │   ├── LessonList.jsx           ← List lessons
│   │   ├── QuestionForm.jsx         ← Add/edit questions
│   │   └── VideoPreview.jsx         ← Simple preview
│   │
│   ├── common/
│   │   ├── AdminNavbar.jsx          ← Navigation bar
│   │   ├── AdminSidebar.jsx         ← Side menu
│   │   ├── FormInput.jsx            ← Reusable input
│   │   ├── Button.jsx               ← Button component
│   │   ├── Modal.jsx                ← Confirm dialogs
│   │   ├── Toast.jsx                ← Success/error messages
│   │   └── LoadingSpinner.jsx       ← Loading indicator
│   │
│   └── forms/
│       ├── CourseForm.jsx           ← Create/edit course
│       ├── ModuleForm.jsx           ← Create/edit module
│       ├── LessonForm.jsx           ← Create/edit lesson
│       └── QuizForm.jsx             ← Create/edit quiz
│
├── services/
│   ├── adminCourseService.js        ← Course API calls
│   ├── adminModuleService.js        ← Module API calls
│   ├── adminLessonService.js        ← Lesson API calls
│   └── adminQuizService.js          ← Quiz API calls
│
├── context/
│   ├── AdminAuthContext.jsx         ← Admin auth state
│   └── AdminCoursesContext.jsx      ← Course data state
│
├── hooks/
│   ├── useAdminAuth.js              ← Auth hook
│   └── useCourseEditor.js           ← Editor state hook
│
└── utils/
    ├── validation.js                ← Form validation
    └── formatters.js                ← Data formatting
```

---

## 📋 BACKEND API ENDPOINTS NEEDED (Phase 2)

### COURSE MANAGEMENT
```
POST   /api/courses
       Create course
       Body: { title, description, level, status, prerequisites, passingScore }

PUT    /api/courses/:id
       Update course
       Body: { title, description, level, status, prerequisites, passingScore }

DELETE /api/courses/:id
       Delete course (soft delete)

GET    /api/courses/:id/full
       Get course with all modules and lessons
```

### MODULE MANAGEMENT
```
POST   /api/courses/:courseId/modules
       Create module
       Body: { title, description, order }

PUT    /api/courses/:courseId/modules/:moduleId
       Update module
       Body: { title, description, order }

DELETE /api/courses/:courseId/modules/:moduleId
       Delete module

GET    /api/courses/:courseId/modules/:moduleId
       Get single module with lessons
```

### LESSON MANAGEMENT
```
POST   /api/courses/:courseId/modules/:moduleId/lessons
       Create lesson
       Body: { title, description, videoUrl, duration, quizId, resources }

PUT    /api/courses/:courseId/modules/:moduleId/lessons/:lessonId
       Update lesson
       Body: { title, description, videoUrl, duration, quizId, resources }

DELETE /api/courses/:courseId/modules/:moduleId/lessons/:lessonId
       Delete lesson

GET    /api/courses/:courseId/modules/:moduleId/lessons/:lessonId
       Get single lesson
```

### QUIZ MANAGEMENT
```
POST   /api/quizzes
       Create quiz
       Body: { title, description, passingScore, maxAttempts, timeLimit, questions }

PUT    /api/quizzes/:id
       Update quiz
       Body: { title, description, passingScore, maxAttempts, timeLimit, questions }

DELETE /api/quizzes/:id
       Delete quiz

GET    /api/quizzes/:id
       Get single quiz
```

---

## ⏱️ SIMPLIFIED BUILD TIMELINE

### Phase 2 - Week 1: Core Admin UI Infrastructure
**Days 1-2:**
1. Build Admin Navbar + Sidebar (reusable layout)
2. Set up routing (React Router)
3. Build basic page shells

**Days 3-4:**
4. Build AdminDashboard page
5. Build AdminCoursesManagement page (list view)
6. Add search/filter functionality

**Days 5:**
7. Build CourseForm component
8. Build AdminCourseEditor page
9. Connect to API

### Phase 2 - Week 2: Module & Lesson Management
**Days 6-7:**
10. Build ModuleForm component
11. Build AdminModuleEditor page
12. Build LessonForm component

**Days 8-9:**
13. Build AdminLessonEditor page (with video URL input)
14. Build VideoPreview component
15. Test video URL functionality

**Days 10:**
16. Build QuizForm component
17. Build AdminQuizBuilder page
18. Test quiz creation

### Phase 2 - Week 3: Polish & Testing
**Days 11-12:**
19. Add form validations
20. Add error handling
21. Add success toasts

**Days 13-14:**
22. Fix bugs
23. Test all CRUD operations
24. Test authorization (admin-only)

**Days 15:**
25. Final QA
26. Documentation
27. Ready for Phase 3

---

## 🎨 COLOR SCHEME (Admin Only)

```
Primary: Purple (#7C3AED)     - Main actions
Secondary: Red (#EF4444)      - Delete/danger
Accent: Teal (#14B8A6)        - Save/publish
Background: Slate (#F1F5F9)   - Page bg
Border: Gray (#E5E7EB)        - Form borders
Text: Gray (#1F2937)          - Main text
Text Light: Gray (#6B7280)    - Helper text
```

---

## ✅ IMPLEMENTATION CHECKLIST

### Admin UI (Frontend) - MVP
- [ ] Admin Navbar
- [ ] Admin Sidebar
- [ ] AdminDashboard page
- [ ] AdminCoursesManagement page (search/filter)
- [ ] CourseForm (create/edit)
- [ ] AdminCourseEditor page
- [ ] ModuleForm (create/edit)
- [ ] AdminModuleEditor page
- [ ] LessonForm (create/edit)
- [ ] AdminLessonEditor page
- [ ] VideoPreview component
- [ ] QuizForm (create/edit)
- [ ] AdminQuizBuilder page
- [ ] FormInput reusable component
- [ ] Modal component (confirm dialogs)
- [ ] Toast notifications
- [ ] Error handling
- [ ] Loading states
- [ ] Form validations
- [ ] Admin auth checks

### Admin API (Backend) - MVP
- [ ] POST /api/courses (create)
- [ ] PUT /api/courses/:id (update)
- [ ] DELETE /api/courses/:id (delete)
- [ ] GET /api/courses/:id/full
- [ ] POST /api/courses/:id/modules (create)
- [ ] PUT /api/courses/:id/modules/:id (update)
- [ ] DELETE /api/courses/:id/modules/:id (delete)
- [ ] POST /api/courses/:id/modules/:id/lessons (create)
- [ ] PUT /api/courses/:id/modules/:id/lessons/:id (update)
- [ ] DELETE /api/courses/:id/modules/:id/lessons/:id (delete)
- [ ] POST /api/quizzes (create)
- [ ] PUT /api/quizzes/:id (update)
- [ ] DELETE /api/quizzes/:id (delete)
- [ ] Admin middleware (auth check)

---

## 🎯 MVP FEATURES SUMMARY

| Feature | Status | Notes |
|---------|--------|-------|
| Create Course | ✅ | Basic form |
| Edit Course | ✅ | Update details |
| Delete Course | ✅ | Soft delete |
| Create Module | ✅ | Simple form |
| Edit Module | ✅ | Reorder via dropdown |
| Create Lesson | ✅ | Video URL only |
| Edit Lesson | ✅ | Change URL, details |
| Delete Lesson | ✅ | With confirmation |
| Create Quiz | ✅ | Multiple choice + T/F |
| Edit Quiz | ✅ | Manage questions |
| Video Upload | ❌ | Use URL only (v2) |
| Drag-drop | ❌ | Use dropdown (v2) |
| Analytics | ❌ | Phase 3 |
| File Upload | ❌ | Phase 3 |

---

## 🚀 QUICK START NEXT STEP

**Want to proceed? Tell me:**

1. **Build the Backend API first?** (Create all endpoints)
2. **Build the Frontend first?** (Start with Navbar + Dashboard)
3. **Build both in parallel?** (If you have 2 developers)

**I'll provide:**
- ✅ Complete code for components
- ✅ Complete API endpoint code
- ✅ Step-by-step build guide
- ✅ Testing instructions

---

*MVP Admin UI - Simplified and focused on core CRUD operations.*  
*No file upload, no drag-drop, no analytics. Just the essentials.*

Ready to build? 🚀
