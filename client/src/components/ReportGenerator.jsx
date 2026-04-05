import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ReportGenerator = ({ targetId, filename }) => {
  const generatePDF = () => {
    const input = document.getElementById(targetId);
    
    if (!input) {
      console.error("Element not found");
      return;
    }

    html2canvas(input, { 
      scale: 2,
      backgroundColor: '#080C18',
      useCORS: true 
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${filename || 'report'}.pdf`);
    });
  };

  return (
    <button 
      onClick={generatePDF} 
      className="auth-button"
      style={{ marginTop: '1rem', fontSize: '0.85rem' }}
    >
      📄 Export PDF Report
    </button>
  );
};

export default ReportGenerator;
