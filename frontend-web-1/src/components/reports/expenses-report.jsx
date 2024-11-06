import React, { useRef, useState, useEffect, useContext } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'
import exportpdf from "../../assets/icons/export.png";
import MonthYearPicker from '../date-picker/date-picker';
import { getExpensesReport } from '../../services/reportsService'; // Make sure this service calls the correct backend endpoint
import { AuthContext } from "../../context/auth-context";
import registerCooperFont from '../fonts/Cooper-ExtraBold-normal';
import registerRubikFont from '../fonts/Rubik-Regular-normal';
import registerRubikBoldFont from '../fonts/Rubik-Bold-normal';
import registerRubikSemiBoldFont from '../fonts/Rubik-SemiBold-normal';

const ExpensesReport = () => {
    const reportRef = useRef();
    const { userRole } = useContext(AuthContext);
    const [expensesData, setExpensesData] = useState({ summary: [], detailed: [] });
    const [selectedDate, setSelectedDate] = useState({
        month: new Date().getMonth(), // Adjust for 1-indexed months
        year: new Date().getFullYear(),
    });

    useEffect(() => {
        registerCooperFont();
        registerRubikFont();
        registerRubikBoldFont();
        registerRubikSemiBoldFont();
    }, []);

    const fetchExpensesData = async (month, year) => {
        try {
            const data = await getExpensesReport(month, year);
            setExpensesData(data);
        } catch (error) {
            console.error('Error fetching expenses data:', error);
        }
    };

    useEffect(() => {
        fetchExpensesData(selectedDate.month, selectedDate.year);
    }, [selectedDate]);

    const generatePDF = () => {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const margin = 20;
        let yPosition = 30;
        const columnWidth = (pdfWidth - 2 * margin) / 2;
        const columnWidth1 = (pdfWidth - 2 * margin) / 3;

        // Header section
        pdf.setFontSize(22);
        pdf.setFont('Cooper-ExtraBold');
        pdf.setTextColor('#F9961F');
        const title1 = 'ARON';
        const title2 = 'BIKES';
        pdf.text(title1, (pdfWidth - pdf.getTextWidth(title1 + title2)) / 2, yPosition);

        pdf.setTextColor('#2E2E2E');
        pdf.text(title2, (pdfWidth + pdf.getTextWidth(title1) - pdf.getTextWidth(title2)) / 2, yPosition);

        pdf.setFontSize(8);
        pdf.setFont('Rubik-Regular');
        yPosition += 6;
        const subtitle = 'Antipolo City';
        pdf.text(subtitle, (pdfWidth - pdf.getTextWidth(subtitle)) / 2, yPosition);

        pdf.setFontSize(16);
        pdf.setFont('Rubik-Bold');
        yPosition += 8;
        const reportTitle = 'Monthly Operational Expenses Report';
        pdf.text(reportTitle, (pdfWidth - pdf.getTextWidth(reportTitle)) / 2, yPosition);

        pdf.setFontSize(11);
        pdf.setFont('Rubik-SemiBold');
        yPosition += 7;
        const reportSubtitle = `(${months[selectedDate.month - 1].label} ${selectedDate.year})`;
        pdf.text(reportSubtitle, (pdfWidth - pdf.getTextWidth(reportSubtitle)) / 2, yPosition);

        pdf.setFontSize(9);
        pdf.setFont('Rubik-Regular');
        yPosition += 7;
        const performanceText = 'Costs related to day-to-day business operations.';
        pdf.text(performanceText, (pdfWidth - pdf.getTextWidth(performanceText)) / 2, yPosition);

        // Report Metadata
        pdf.setFontSize(8);
        yPosition += 14;
        pdf.text(`Date generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, margin, yPosition);
        yPosition += 6;
        pdf.text(`Time generated: ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`, margin, yPosition);
        yPosition += 6;
        pdf.text(`Generated by: ${userRole.charAt(0).toUpperCase() + userRole.slice(1)}`, margin, yPosition);


        pdf.setFontSize(9);
        pdf.setFont('Rubik-Regular');
        yPosition += 10;
        const label = 'Total Operational Expenses:';
        pdf.text(label, margin, yPosition);
        pdf.setFont('Rubik-SemiBold');
        const value = `P ${PesoFormat.format(expensesData.summary.reduce((acc, item) => acc + Number(item.total_amount || 0), 0))}`;
        pdf.text(value, margin + pdf.getTextWidth(label), yPosition);

        // "Summary List of Operational Expenses"
        pdf.setFontSize(9);
        pdf.setFont('Rubik-SemiBold');
        yPosition += 10;
        const summaryHeader = "Summary List of Operational Expenses";
        pdf.text(summaryHeader, margin, yPosition);

        // Summary Table
        autoTable(pdf, {
            startY: yPosition + 4,
            theme: 'grid',
            body: expensesData.summary.length > 0
                ? expensesData.summary.map(item => [
                    item.expense_name || '-',
                    item.total_amount !== undefined ? `P ${PesoFormat.format(item.total_amount)}` : '-'
                ])
                : [['-', '-']],
            headStyles: {
                fillColor: [46, 46, 46],
                font: 'Rubik-SemiBold',
                halign: 'center',
                fontSize: 9
            },
            bodyStyles: {
                halign: 'center',
                font: 'Rubik-Regular',
                fontSize: 9,
                textColor: [0, 0, 0]
            },
            columnStyles: {
                0: { cellWidth: columnWidth, halign: 'center' },
                1: { cellWidth: columnWidth, halign: 'right' },
            },
            margin: { left: 20, right: 20 },
            styles: {
                font: 'Rubik-Regular',  // Set default font for table
                fontSize: 10,
                cellPadding: 2,
                lineWidth: 0.1, // Ensures the body cells also have a consistent border width
                lineColor: [0, 0, 0]
            },
            tableWidth: 'auto'
        });

        // "Expenses" section header
        yPosition = pdf.lastAutoTable.finalY + 7;
        pdf.setFont('Rubik-SemiBold');
        const expenseHeader = "Expenses";
        pdf.text(expenseHeader, margin, yPosition);

        // Detailed Expenses Table
        autoTable(pdf, {
            startY: yPosition + 4,
            theme: 'grid',
            head: [['Day', 'Expense', 'Amount']],
            body: organizedExpensesData.map(item => [
                formatDate(item.day, selectedDate.month, selectedDate.year),
                item.expense_name || '-',
                item.expense_amount ? `P ${PesoFormat.format(item.expense_amount)}` : '-'
            ]),
            headStyles: {
                fillColor: [46, 46, 46],
                font: 'Rubik-SemiBold',
                halign: 'center',
                fontSize: 9
            },
            bodyStyles: {
                font: 'Rubik-Regular',
                fontStyle: 'normal',
                fontSize: 9,
                textColor: [0, 0, 0]
            },
            columnStyles: {
                0: { cellWidth: columnWidth1, halign: 'center' },
                1: { cellWidth: columnWidth1, halign: 'center' },
                2: { cellWidth: columnWidth1, halign: 'right' }
            },
            margin: { left: 20, right: 20 },
            styles: {
                font: 'Rubik-Regular',
                fontSize: 10,
                cellPadding: 2,
                lineWidth: 0.1, // Ensures the body cells also have a consistent border width
                lineColor: [0, 0, 0]
            },
            tableWidth: 'auto'
        });

        // Display PDF in a new window
        // pdf.output("dataurlnewwindow"); for debug
        pdf.save(`${months[selectedDate.month - 1].label}_${selectedDate.year}_Expenses_Report.pdf`);
    };

    const months = [
        { value: 0, label: 'January' },
        { value: 1, label: 'February' },
        { value: 2, label: 'March' },
        { value: 3, label: 'April' },
        { value: 4, label: 'May' },
        { value: 5, label: 'June' },
        { value: 6, label: 'July' },
        { value: 7, label: 'August' },
        { value: 8, label: 'September' },
        { value: 9, label: 'October' },
        { value: 10, label: 'November' },
        { value: 11, label: 'December' }
    ];

    const PesoFormat = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "PHP",
    });

    const formatDate = (day, month, year) => {
        const date = new Date(year, month - 1, day);
        return `${date.toLocaleString('en-US', { month: 'short' })} ${day}`;
    };

    const organizeExpensesDataByDay = (expensesData, month, year) => {
        const currentDate = new Date();
        const isCurrentMonth = month === currentDate.getMonth() + 1 && year === currentDate.getFullYear();
        const daysInMonth = isCurrentMonth ? currentDate.getDate() : new Date(year, month, 0).getDate();
        const expensesByDay = {};

        expensesData.forEach((item) => {
            const day = item.day;
            if (!expensesByDay[day]) expensesByDay[day] = [];
            expensesByDay[day].push(item);
        });

        const organizedDays = [];
        for (let day = 1; day <= daysInMonth; day++) {
            if (expensesByDay[day]) {
                expensesByDay[day].forEach((item) => {
                    organizedDays.push({ day, ...item });
                });
            } else {
                organizedDays.push({ day, empty: true });
            }
        }
        return organizedDays;
    };


    const organizedExpensesData = organizeExpensesDataByDay(expensesData.detailed, selectedDate.month, selectedDate.year);

    return (
        <>
            <div className='upper'>
                <MonthYearPicker setSelectedDate={setSelectedDate} />
                <button onClick={generatePDF} style={{ marginTop: '20px' }}>
                    <img src={exportpdf} alt="export-icon" />
                    Export
                </button>
            </div>

            <div ref={reportRef} className="pdf-content">
                <div className="upper-text" style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <h1><span>ARON</span><span>BIKES</span></h1>
                    <p>Antipolo City</p>
                    <h3>Monthly Operational Expenses Report</h3>
                    <h6>({`${months[selectedDate.month - 1].label} ${selectedDate.year}`})</h6>
                    <p>Costs related to day-to-day business operations.</p>
                </div>

                <div className='mt-4 mb-4'>
                    <p>Date generated:&nbsp;&nbsp;&nbsp;{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    <p>Time generated:&nbsp;&nbsp;&nbsp;{new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}</p>
                    <p>Generated by:&nbsp;&nbsp;&nbsp;{userRole.charAt(0).toUpperCase() + userRole.slice(1)}</p>
                </div>

                <div className='mb-4 fs-6'>
                    Total Operational Expenses: <b>{PesoFormat.format(expensesData.summary.reduce((acc, item) => acc + Number(item.total_amount || 0), 0))}</b>
                </div>

                <div className='fs-6 fw-bold mb-3'>
                    Summary List of Operational Expenses
                </div>

                <table className='mb-4'>
                    <tbody>
                        {expensesData.summary.length > 0 ? (
                            expensesData.summary.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.expense_name}</td>
                                    <td className='text-end'>{PesoFormat.format(item.total_amount)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td>-</td>
                                <td className='text-end'>-</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <div className='fs-6 fw-bold mb-3'>
                    Expenses
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Day</th>
                            <th>Expense</th>
                            <th className='text-end'>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {organizedExpensesData.map((item, index) => (
                            <tr key={index}>
                                <td>{item.empty ? formatDate(item.day, selectedDate.month, selectedDate.year) : formatDate(item.day, selectedDate.month, selectedDate.year)}</td>
                                <td>{item.empty ? '-' : item.expense_name || 'N/A'}</td>
                                <td className='text-end'>{item.empty ? '-' : PesoFormat.format(item.expense_amount || 0)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <p className='mt-4 fs-7 fw-light'> @2024 GearUp. All rights reserved.</p>
            </div>
        </>
    );
};

export default ExpensesReport;
