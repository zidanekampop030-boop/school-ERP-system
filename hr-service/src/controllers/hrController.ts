import { Request, Response } from 'express';
import { Staff } from '../models/Staff';
import { PayrollDeduction } from '../models/PayrollDeduction';

export const createStaff = async (req: Request, res: Response) => {
  try {
    const { name, email, department, baseSalary } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const staff = await Staff.create({ name, email, department, baseSalary });
    return res.status(201).json(staff);
  } catch (error: any) {
    console.error('Error creating staff member:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

export const listStaff = async (req: Request, res: Response) => {
  try {
    const staff = await Staff.findAll();
    return res.status(200).json(staff);
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const calculatePayroll = async (req: Request, res: Response) => {
  try {
    const { staffId } = req.params;
    const { month, otherDeductions } = req.body; // month format: '2026-08'

    const targetMonth = month || new Date().toISOString().substring(0, 7);
    const extraDeductions = parseFloat(otherDeductions || '0');

    // Find staff member
    const staff = await Staff.findByPk(staffId);
    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Check if payroll already calculated for this month
    const existing = await PayrollDeduction.findOne({ where: { staffId, month: targetMonth } });
    if (existing) {
      return res.status(400).json({ error: `Payroll for month ${targetMonth} has already been calculated` });
    }

    // Calculate tax (Tiered tax brackets)
    const base = parseFloat(staff.baseSalary.toString());
    let taxRate = 0.10; // 10% default
    if (base > 5000) {
      taxRate = 0.20; // 20%
    } else if (base > 3000) {
      taxRate = 0.15; // 15%
    }
    const taxAmount = base * taxRate;
    const netSalary = base - taxAmount - extraDeductions;

    // Create payroll deduction record
    const payroll = await PayrollDeduction.create({
      staffId: staff.id,
      month: targetMonth,
      taxAmount,
      otherDeductions: extraDeductions,
      netSalary,
    });

    // Generate pay slip response (satisfying Week 5 HR feature)
    return res.status(201).json({
      message: 'Payroll calculated successfully',
      payslip: {
        payslipId: `PAY-${payroll.id.substring(0, 8).toUpperCase()}`,
        staffId: staff.id,
        name: staff.name,
        email: staff.email,
        department: staff.department,
        month: payroll.month,
        earnings: {
          baseSalary: base,
        },
        deductions: {
          tax: taxAmount,
          taxRate: `${taxRate * 100}%`,
          other: extraDeductions,
        },
        netSalary: payroll.netSalary,
        calculatedAt: payroll.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error calculating payroll:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

export const getStaffPayrollHistory = async (req: Request, res: Response) => {
  try {
    const { staffId } = req.params;
    const currentUser = (req as any).user;

    const staff = await Staff.findByPk(staffId, {
      include: [PayrollDeduction],
    });

    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // BOLA Security Check: Staff member can only view their own payroll records.
    // Admin can view anyone's payroll. Staff role can view anyone's payroll only if they are HR/Admin staff (we check email match)
    if (currentUser.role === 'Student') {
      return res.status(403).json({ error: 'Forbidden: Students cannot access staff payroll records' });
    }
    
    if (currentUser.role === 'Staff' && currentUser.email !== staff.email) {
      return res.status(403).json({ error: 'Forbidden: You cannot access another staff member\'s payroll (BOLA Prevention)' });
    }

    return res.status(200).json({
      staff: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        department: staff.department,
      },
      payrollHistory: (staff as any).PayrollDeductions,
    });
  } catch (error: any) {
    console.error('Error fetching payroll history:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
