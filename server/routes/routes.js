import express from "express";
import * as controllers from "../controllers/controllers.js";

const router = express.Router();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.get("/health", (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [HEALTH] Health check requested`);
  res.json({
    success: true,
    message: "Server is running",
    timestamp,
    database: "connected"
  });
});

// ======================= Academic =======================
router.get("/departments", asyncHandler(controllers.getAllDepartments));
router.get("/departments/:id", asyncHandler(controllers.getDepartmentById));
router.post("/departments", asyncHandler(controllers.createDepartment));
router.put("/departments/:id", asyncHandler(controllers.updateDepartment));
router.delete("/departments/:id", asyncHandler(controllers.deleteDepartment));

router.get("/faculties", asyncHandler(controllers.getAllFaculties));
router.get("/faculties/:id", asyncHandler(controllers.getFacultyById));
router.post("/faculties", asyncHandler(controllers.createFaculty));
router.put("/faculties/:id", asyncHandler(controllers.updateFaculty));
router.delete("/faculties/:id", asyncHandler(controllers.deleteFaculty));

router.get("/majors", asyncHandler(controllers.getAllMajors));
router.get("/majors/with-latest-programs", asyncHandler(controllers.getMajorsWithLatestYearPrograms));
router.post("/majors", asyncHandler(controllers.createMajor));
router.get("/majors/:id/tuition", asyncHandler(controllers.getMajorTuition));
router.get("/majors/:id/tuition-by-years", asyncHandler(controllers.getMajorTuitionByYears));
router.get("/majors/:id", asyncHandler(controllers.getMajorById));
router.put("/majors/:id", asyncHandler(controllers.updateMajor));
router.delete("/majors/:id", asyncHandler(controllers.deleteMajor));

router.get("/programs", asyncHandler(controllers.getAllPrograms));
router.post("/programs", asyncHandler(controllers.createProgram));
router.put("/programs/:id/price", asyncHandler(controllers.updateProgramPrice));
router.get("/programs/:id", asyncHandler(controllers.getProgramById));
router.put("/programs/:id", asyncHandler(controllers.updateProgram));
router.delete("/programs/:id", asyncHandler(controllers.deleteProgram));
router.get("/programs/:id/courses", asyncHandler(controllers.getProgramCourses));
router.post("/programs/:id/courses", asyncHandler(controllers.addCourseToProgram));
router.delete("/programs/:id/courses/:courseId", asyncHandler(controllers.removeCourseFromProgram));
router.put("/programs/:id/courses/:courseId", asyncHandler(controllers.updateProgramCourse));
router.post("/programs/:id/knowledge-blocks", asyncHandler(controllers.addKnowledgeBlockToProgram));
router.delete("/programs/:id/knowledge-blocks/:blockId", asyncHandler(controllers.removeKnowledgeBlockFromProgram));

router.get("/courses", asyncHandler(controllers.getAllCourses));
router.post("/courses", asyncHandler(controllers.createCourse));
router.post("/courses/get-names-by-ids", asyncHandler(controllers.getCourseNamesByIds));
router.post("/courses/check-prerequisites", asyncHandler(controllers.checkPrerequisites));
router.get("/courses/:id", asyncHandler(controllers.getCourseById));
router.put("/courses/:id", asyncHandler(controllers.updateCourse));
router.delete("/courses/:id", asyncHandler(controllers.deleteCourse));

router.get("/course-categories", asyncHandler(controllers.getAllCourseCategories));
router.get("/course-categories/:id", asyncHandler(controllers.getCourseCategoryById));

router.get("/knowledge-blocks", asyncHandler(controllers.getAllKnowledgeBlocks));
router.post("/knowledge-blocks", asyncHandler(controllers.createKnowledgeBlock));
router.put("/knowledge-blocks/:id", asyncHandler(controllers.updateKnowledgeBlock));
router.delete("/knowledge-blocks/:id", asyncHandler(controllers.deleteKnowledgeBlock));

router.get("/curriculum-structure", asyncHandler(controllers.getAllCurriculumStructures));
router.post("/curriculum-structure", asyncHandler(controllers.createCurriculumStructure));
router.put("/curriculum-structure/:id", asyncHandler(controllers.updateCurriculumStructure));
router.delete("/curriculum-structure/:id", asyncHandler(controllers.deleteCurriculumStructure));

router.get("/curriculum-viewer/full", asyncHandler(controllers.getFullCurriculum));

router.get("/cohorts", asyncHandler(controllers.getAllCohorts));
router.get("/cohorts/:id", asyncHandler(controllers.getCohortById));
router.post("/cohorts", asyncHandler(controllers.createCohort));
router.put("/cohorts/:id", asyncHandler(controllers.updateCohort));
router.delete("/cohorts/:id", asyncHandler(controllers.deleteCohort));

// ======================= People =======================
router.get("/employees", asyncHandler(controllers.getAllEmployees));
router.get("/employees/:id", asyncHandler(controllers.getEmployeeById));
router.post("/employees", asyncHandler(controllers.createEmployee));
router.put("/employees/:id", asyncHandler(controllers.updateEmployee));
router.delete("/employees/:id", asyncHandler(controllers.deleteEmployee));

router.get("/lecturers", asyncHandler(controllers.getLecturers));
router.get("/staff", asyncHandler(controllers.getStaff));

router.get("/users", asyncHandler(controllers.getAllUsers));
router.get("/users/:id", asyncHandler(controllers.getUserById));
router.post("/users", asyncHandler(controllers.createUser));
router.put("/users/:id", asyncHandler(controllers.updateUser));
router.delete("/users/:id", asyncHandler(controllers.deleteUser));

router.get("/positions", asyncHandler(controllers.getAllPositions));
router.post("/positions", asyncHandler(controllers.createPosition));
router.put("/positions/:id", asyncHandler(controllers.updatePosition));
router.delete("/positions/:id", asyncHandler(controllers.deletePosition));

// ======================= Dashboard & Finance =======================
router.get("/dashboard/stats", asyncHandler(controllers.getDashboardStats));
router.get("/tuition/:id", asyncHandler(controllers.getTuitionByProgramId));

export default router;

