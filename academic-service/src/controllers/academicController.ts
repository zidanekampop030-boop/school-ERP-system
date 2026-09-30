import { Request, Response } from 'express';
import { Student } from '../models/Student';
import { Course } from '../models/Course';
import { Enrollment } from '../models/Enrollment';
import { publishEnrollmentEvent } from '../config/rabbitmq';

export const createStudent = async (req: Request, res: Response) => {
  try {
    const { name, email, enrollmentDate } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const student = await Student.create({ name, email, enrollmentDate });
    return res.status(201).json(student);
  } catch (error: any) {
    console.error('Error creating student:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

export const createCourse = async (req: Request, res: Response) => {
  try {
    const { code, title, credits } = req.body;
    if (!code || !title) {
      return res.status(400).json({ error: 'Course code and title are required' });
    }

    const course = await Course.create({ code, title, credits });
    return res.status(201).json(course);
  } catch (error: any) {
    console.error('Error creating course:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

export const enrollStudent = async (req: Request, res: Response) => {
  try {
    const { studentId, courseId } = req.body;
    if (!studentId || !courseId) {
      return res.status(400).json({ error: 'Student ID and Course ID are required' });
    }

    // Verify student exists
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Verify course exists
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check if already enrolled
    const existing = await Enrollment.findOne({ where: { studentId, courseId } });
    if (existing) {
      return res.status(400).json({ error: 'Student is already enrolled in this course' });
    }

    // Create enrollment
    const enrollment = await Enrollment.create({ studentId, courseId });

    // Calculate tuition fee: e.g. $150 per credit
    const costPerCredit = 150;
    const totalAmount = course.credits * costPerCredit;

    // Publish event to RabbitMQ for billing in finance-service
    await publishEnrollmentEvent({
      studentId: student.id,
      studentName: student.name,
      studentEmail: student.email,
      courseCode: course.code,
      courseTitle: course.title,
      amount: totalAmount,
    });

    return res.status(201).json({
      message: 'Student enrolled successfully and billing event emitted.',
      enrollment,
    });
  } catch (error: any) {
    console.error('Error enrolling student:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

export const updateGrade = async (req: Request, res: Response) => {
  try {
    const { enrollmentId } = req.params;
    const { grade } = req.body;

    if (!grade || !['A', 'B', 'C', 'D', 'F'].includes(grade)) {
      return res.status(400).json({ error: 'Valid grade (A, B, C, D, F) is required' });
    }

    const enrollment = await Enrollment.findByPk(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment record not found' });
    }

    enrollment.grade = grade;
    await enrollment.save();

    return res.status(200).json({ message: 'Grade updated successfully', enrollment });
  } catch (error: any) {
    console.error('Error updating grade:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getTranscript = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const currentUser = (req as any).user;

    const student = await Student.findByPk(studentId, {
      include: [
        {
          model: Enrollment,
          include: [Course],
        },
      ],
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // BOLA Security Check: Student can only view their own transcript.
    // Admin and Staff can view anyone's transcript.
    if (currentUser.role === 'Student' && currentUser.email !== student.email) {
      return res.status(403).json({ error: 'Forbidden: You cannot access another student\'s transcript (BOLA Prevention)' });
    }

    // Calculate GPA
    const gradePoints: Record<string, number> = { A: 4, B: 3, C: 2, D: 1, F: 0 };
    let totalPoints = 0;
    let totalCredits = 0;
    const transcriptCourses = (student as any).Enrollments.map((en: any) => {
      const gPoint = en.grade ? gradePoints[en.grade] : null;
      if (gPoint !== null && en.Course) {
        totalPoints += gPoint * en.Course.credits;
        totalCredits += en.Course.credits;
      }
      return {
        enrollmentId: en.id,
        courseCode: en.Course?.code,
        courseTitle: en.Course?.title,
        credits: en.Course?.credits,
        grade: en.grade || 'IP (In Progress)',
      };
    });

    const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 'N/A';

    return res.status(200).json({
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        enrollmentDate: student.enrollmentDate,
      },
      transcript: transcriptCourses,
      summary: {
        totalCreditsAttempted: totalCredits,
        cumulativeGPA: gpa,
      },
    });
  } catch (error: any) {
    console.error('Error fetching transcript:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

export const listStudents = async (req: Request, res: Response) => {
  try {
    const students = await Student.findAll();
    return res.status(200).json(students);
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const listCourses = async (req: Request, res: Response) => {
  try {
    const courses = await Course.findAll();
    return res.status(200).json(courses);
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
