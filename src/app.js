import dns from "node:dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "node:path";


// Existing routes
import authRoutes from "./routes/auth.routes.js";
import studentRoutes from "./routes/student.routes.js";
import classRoutes from "./routes/class.routes.js";
import sessionRoutes from "./routes/session.routes.js";
import subjectRoutes from "./routes/subject.routes.js";
import teacherRoutes from "./routes/teacher.routes.js";
import sectionRoutes from "./routes/section.routes.js";
import schoolRoutes from "./routes/school.routes.js";
import timetableRoutes from "./routes/timetable.routes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import teacherAttendanceRoutes from "./routes/teacherAttendance.routes.js";
import departmentRoutes from "./routes/department.routes.js";
import leaveRoutes from "./routes/leave.routes.js";
import attendanceSettingsRoutes from "./routes/attendanceSettings.routes.js";


// Holiday routes — import only once
import holidayRoutes from "./routes/holiday.routes.js";
import feeStructuresRoutes from "./routes/fee-structures.routes.js";
// Staff routes
import staffRoutes from "./routes/staff.routes.js";
import staffAttendanceRoutes from "./routes/staffAttendance.routes.js";
import feesRoutes from "./routes/fees.routes.js";
import examRoutes from "./routes/exam.routes.js";
import classSubjectRoutes from "./routes/class-subject.routes.js";
import homeworkRoutes from "./routes/homework.routes.js";
import biometricRoutes from "./routes/biometric.routes.js";
import studentPromotionRoutes from "./routes/studentPromotion.routes.js";
import galleryRoutes from "./routes/gallery.routes.js";
import libraryRoutes from "./routes/library.routes.js";
import staffSalaryRoutes from "./routes/staffSalary.routes.js";
import visitorRoutes from "./routes/visitors.routes.js";


import noticeRoutes from "./routes/notice.routes.js";
import noticeSettingsRoutes from "./routes/noticeSettings.routes.js";
import frontOfficeRoutes from "./routes/frontOffice.routes.js";
import academicRoutes from "./routes/academicRoutes.js";
import payrollRoutes from "./routes/payroll.routes.js";
import certificateRoutes from "./routes/certificate.routes.js";
import certificateSettingRoutes from "./routes/certificateSetting.routes.js";
import certificateTemplateRoutes from "./routes/certificateTemplate.routes.js";
import onlineAdmissionRoutes from "./routes/onlineAdmission.routes.js";
import admissionSettingRoutes from "./routes/admissionSetting.routes.js";

const app = express();
// --------------------
// Middleware
// --------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(
  "/uploads/notices",
  express.static(
    path.resolve(process.cwd(), "uploads", "notices"),
    {
      dotfiles: "deny",
      index: false,
      setHeaders: (res) => {
        res.setHeader("X-Content-Type-Options", "nosniff");
      },
    }
  )
);
app.use("/api/notices", noticeRoutes);
app.use("/api/notice-settings", noticeSettingsRoutes);
app.use(cookieParser());
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(morgan("dev"));

// --------------------
// Gallery Image/PDF uploads
// --------------------
app.use(
  "/uploads/gallery",
  express.static(
    path.resolve(process.cwd(), "uploads", "gallery"),
    {
      dotfiles: "deny",
      index: false,
      setHeaders: (res) => {
        res.setHeader("X-Content-Type-Options", "nosniff");
      },
    }
  )
);

app.use(
  "/uploads/homework",
  express.static(path.resolve("uploads/homework"), {
    dotfiles: "deny",
    index: false,
    maxAge: "1h",
  })
);
// --------------------
// Holiday PDF/Image uploads
// --------------------
app.use(
  "/uploads/holidays",
  express.static(
    path.resolve(process.cwd(), "uploads", "holidays")
  )
);

// --------------------
// API Routes
// --------------------
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/sections", sectionRoutes);
app.use("/api/school", schoolRoutes);
app.use("/api/timetables", timetableRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/teacher-attendance", teacherAttendanceRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/attendance-settings", attendanceSettingsRoutes);
app.use("/api/fees", feesRoutes);
app.use("/api/fee-structures", feeStructuresRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/class-subjects", classSubjectRoutes);
app.use("/api/homework", homeworkRoutes);
app.use("/api/biometric", biometricRoutes);
app.use("/api/student-promotions", studentPromotionRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/library", libraryRoutes);
app.use("/api/staff-salaries", staffSalaryRoutes);
app.use("/api/front-office", frontOfficeRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/certificate-settings", certificateSettingRoutes);
app.use("/api/certificate-templates", certificateTemplateRoutes);
app.use("/api/online-admission", onlineAdmissionRoutes);
app.use("/api/admission-settings", admissionSettingRoutes);
app.use("/api/visitors", visitorRoutes);






// Holiday API
app.use("/api/holidays", holidayRoutes);



// Staff API
app.use("/api/staff", staffRoutes);
app.use("/api/staff-attendance", staffAttendanceRoutes);

// --------------------
// Health check
// --------------------
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "School ERP API Running Successfully",
  });
});

export default app;
