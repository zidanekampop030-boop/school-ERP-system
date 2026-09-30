import { Request, Response } from 'express';
import { Invoice } from '../models/Invoice';
import { Payment } from '../models/Payment';

export const getStudentInvoices = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const currentUser = (req as any).user;

    const invoices = await Invoice.findAll({ where: { studentId } });

    if (invoices.length === 0) {
      return res.status(200).json([]);
    }

    // BOLA Security Check: Student can only view their own invoices.
    // Admin and Staff can view anyone's invoices.
    if (currentUser.role === 'Student' && currentUser.email !== invoices[0].studentEmail) {
      return res.status(403).json({ error: 'Forbidden: You cannot access another student\'s invoices (BOLA Prevention)' });
    }

    return res.status(200).json(invoices);
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const payInvoice = async (req: Request, res: Response) => {
  try {
    const { invoiceId } = req.params;
    const { paymentMethod, amountPaid } = req.body;

    const invoice = await Invoice.findByPk(invoiceId);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status === 'PAID') {
      return res.status(400).json({ error: 'Invoice is already paid' });
    }

    const payAmount = amountPaid || invoice.amount;

    // Create payment record
    const payment = await Payment.create({
      invoiceId: invoice.id,
      amountPaid: payAmount,
      paymentMethod: paymentMethod || 'CREDIT_CARD',
    });

    // Update invoice status
    invoice.status = 'PAID';
    await invoice.save();

    // Generate receipt response (satisfying Week 5 Finance feature)
    return res.status(200).json({
      message: 'Payment processed successfully',
      receipt: {
        receiptNumber: `REC-${payment.id.substring(0, 8).toUpperCase()}`,
        paymentId: payment.id,
        invoiceId: invoice.id,
        studentName: invoice.studentName,
        studentEmail: invoice.studentEmail,
        courseCode: invoice.courseCode,
        amountPaid: payment.amountPaid,
        paymentDate: payment.paymentDate,
        paymentMethod: payment.paymentMethod,
        invoiceStatus: invoice.status,
      },
    });
  } catch (error: any) {
    console.error('Error paying invoice:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const listAllInvoices = async (req: Request, res: Response) => {
  try {
    const invoices = await Invoice.findAll();
    return res.status(200).json(invoices);
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
