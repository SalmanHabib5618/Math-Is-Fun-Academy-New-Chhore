import React, { useState } from 'react';
import { CreditCard, DollarSign, Plus, CheckCircle, Clock, FileWarning, Search, X, ShieldCheck } from 'lucide-react';
import { User, Fee } from '../types';

interface FeesViewProps {
  user: User;
  students: User[]; // Available for teachers to issue invoices
  fees: Fee[];
  onRefresh: () => Promise<void>;
}

export default function FeesView({ user, students, fees, onRefresh }: FeesViewProps) {
  const isTeacher = user.role === 'teacher' || user.role === 'admin';

  // State for new billing invoice (Teachers only)
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [amount, setAmount] = useState('5000.00');
  const [dueDate, setDueDate] = useState('');
  const [month, setMonth] = useState('July 2026');

  // Simulated Payment Modal states (Students only)
  const [payingFee, setPayingFee] = useState<Fee | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Action states
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Aggregate metrics
  const totalInvoiced = fees.reduce((acc, curr) => acc + curr.amount, 0);
  const totalCollected = fees.filter(f => f.status === 'Paid').reduce((acc, curr) => acc + curr.amount, 0);
  const totalOutstanding = fees.filter(f => f.status !== 'Paid').reduce((acc, curr) => acc + curr.amount, 0);

  // Submit tuition invoice
  const handleIssueInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedStudentId || !amount || !dueDate || !month) {
      setError('Please select a student, enter amount, pick a due date, and select billing month.');
      return;
    }

    const student = students.find(s => s.id === selectedStudentId);
    if (!student) {
      setError('Student not found in center database records.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/fees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          'x-user-role': user.role
        },
        body: JSON.stringify({
          studentId: student.id,
          studentName: student.name,
          amount: Number(amount),
          dueDate,
          month
        })
      });

      if (!res.ok) {
        throw new Error('Failed to issue billing invoice');
      }

      setSelectedStudentId('');
      setSuccess(`Invoiced Rs. ${amount} successfully to ${student.name}!`);
      await onRefresh();
    } catch (err: any) {
      setError(err.message || 'Error occurred while creating fee invoice.');
    } finally {
      setLoading(false);
    }
  };

  // Simulated Secure Online Payment
  const handleSimulatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingFee) return;

    setError('');
    setLoading(true);

    try {
      // Real API status update!
      const res = await fetch(`/api/fees/pay/${payingFee.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          'x-user-role': user.role
        },
        body: JSON.stringify({ status: 'Paid' })
      });

      if (!res.ok) {
        throw new Error('Transaction rejected by billing gateway.');
      }

      setPayingFee(null);
      setCardNumber('');
      setCardExpiry('');
      setCardCvc('');
      setSuccess('Transaction completed successfully! Invoice updated to Paid.');
      await onRefresh();
    } catch (err: any) {
      setError(err.message || 'Gateway connection error.');
    } finally {
      setLoading(false);
    }
  };

  // Filter
  const filteredFees = fees.filter(fee => {
    return (
      fee.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fee.month.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fee.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Billing & Tuition Fees</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage center receivables, track invoice statuses, and process secure simulated payments.</p>
        </div>
      </div>

      {/* Aggregate Financial Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
              {isTeacher ? 'Total Billings Issued' : 'Total Course Dues'}
            </span>
            <span className="text-xl font-black text-slate-900">
              Rs. {isTeacher ? totalInvoiced : fees.reduce((acc, curr) => acc + curr.amount, 0)}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Total Fees Paid</span>
            <span className="text-xl font-black text-blue-600">
              Rs. {isTeacher ? totalCollected : fees.filter(f => f.status === 'Paid').reduce((acc, curr) => acc + curr.amount, 0)}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded">
            <FileWarning className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Outstanding Balance</span>
            <span className="text-xl font-black text-red-600">
              Rs. {isTeacher ? totalOutstanding : fees.filter(f => f.status !== 'Paid').reduce((acc, curr) => acc + curr.amount, 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Feedback messages */}
      {success && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded text-blue-600 text-xs font-medium">
          {success}
        </div>
      )}
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded text-red-600 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Main Panel grids */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Invoice form (Teachers only) */}
        {isTeacher && (
          <div className="lg:col-span-4 bg-white p-6 rounded-xl border border-slate-200 h-fit">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
              <Plus className="h-4.5 w-4.5 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-sm">Issue Fee Invoice</h3>
            </div>

            <form onSubmit={handleIssueInvoice} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Select Student
                </label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-xs text-slate-800 bg-white"
                >
                  <option value="">-- Choose Student --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.class})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Invoice Amount (Rs.)
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="1"
                    placeholder="5000.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Billing Cycle Month
                  </label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-xs text-slate-800 bg-white"
                  >
                    <option value="June 2026">June 2026</option>
                    <option value="July 2026">July 2026</option>
                    <option value="August 2026">August 2026</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Payment Due Date
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-xs text-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 text-xs font-semibold rounded text-white bg-blue-600 hover:bg-blue-700 transition cursor-pointer"
              >
                {loading ? 'Issuing...' : 'Issue Tuition Invoice'}
              </button>
            </form>
          </div>
        )}

        {/* Ledger table */}
        <div className={isTeacher ? 'lg:col-span-8 space-y-4' : 'lg:col-span-12 space-y-4'}>
          {isTeacher && (
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student or status..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-xs text-slate-800 placeholder-slate-400"
                />
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-xs sm:text-sm uppercase tracking-wider">Fee Ledgers & Invoices</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                    {isTeacher && <th className="px-6 py-3.5">Student</th>}
                    <th className="px-6 py-3.5">Billing Month</th>
                    <th className="px-6 py-3.5">Amount</th>
                    <th className="px-6 py-3.5">Due Date</th>
                    <th className="px-6 py-3.5">Status</th>
                    {!isTeacher && <th className="px-6 py-3.5 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFees.length > 0 ? (
                    filteredFees.map(fee => (
                      <tr key={fee.id} className="hover:bg-slate-50/50 transition">
                        {isTeacher && (
                          <td className="px-6 py-3.5 font-bold text-slate-800">
                            {fee.studentName}
                          </td>
                        )}
                        <td className="px-6 py-3.5 text-slate-500 font-medium">
                          {fee.month}
                        </td>
                        <td className="px-6 py-3.5 font-bold text-slate-800 font-mono">
                          Rs. {fee.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-3.5 text-slate-400 font-medium font-mono">
                          {fee.dueDate}
                        </td>
                        <td className="px-6 py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            fee.status === 'Paid'
                              ? 'bg-blue-50 text-blue-600 border border-blue-200'
                              : fee.status === 'Pending'
                              ? 'bg-slate-100 text-slate-600 border border-slate-200'
                              : 'bg-red-50 text-red-600 border border-red-200'
                          }`}>
                            {fee.status}
                          </span>
                        </td>
                        {!isTeacher && (
                          <td className="px-6 py-3.5 text-right">
                            {fee.status !== 'Paid' ? (
                              <button
                                onClick={() => setPayingFee(fee)}
                                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 font-bold text-[10px] text-white rounded transition cursor-pointer"
                              >
                                Pay Invoice
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium font-mono">Paid {fee.paidDate}</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={isTeacher ? 6 : 5} className="px-6 py-10 text-center text-slate-400 text-xs">
                        No invoices registered in record books.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* --- CREDIT CARD SECURE SIMULATOR MODAL --- */}
      {payingFee && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-sm w-full overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4.5 w-4.5 text-blue-400" />
                <h4 className="font-bold text-xs sm:text-sm">Secure Payment Gateway</h4>
              </div>
              <button
                onClick={() => setPayingFee(null)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
                aria-label="Close payment gateway"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSimulatePayment} className="p-6 space-y-4">
              {/* Bill Details preview */}
              <div className="bg-slate-50 border border-slate-200 rounded p-3 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Invoice Month</span>
                  <span className="font-bold text-slate-800">{payingFee.month}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Total Payable</span>
                  <span className="font-bold text-slate-800 font-mono">Rs. {payingFee.amount.toFixed(2)}</span>
                </div>
              </div>

              {/* Secure logo disclaimer */}
              <div className="flex items-center gap-2 bg-blue-50/40 p-2.5 rounded border border-blue-100 text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                <ShieldCheck className="h-4 w-4 text-blue-500 shrink-0" />
                <span>Simulated Sandbox Gateway.</span>
              </div>

              {/* Dummy Credit Card Details */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  required
                  pattern="\d{16}"
                  maxLength={16}
                  placeholder="4000 1234 5678 9010"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-xs text-slate-800 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Expiry MM/YY
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    placeholder="12/28"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-xs text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Secure CVC
                  </label>
                  <input
                    type="password"
                    required
                    pattern="\d{3}"
                    maxLength={3}
                    placeholder="•••"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-xs text-slate-800 font-mono text-center"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 text-xs font-semibold rounded text-white bg-blue-600 hover:bg-blue-700 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                {loading ? 'Processing Secure Connection...' : `Pay Rs. ${payingFee.amount.toFixed(2)} Now`}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
