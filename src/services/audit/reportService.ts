import axios from 'axios';
import { addNotification } from '../../store/slices/uiSlice';
import { store } from '../../store/store';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export interface ReportOptions {
  format: 'pdf' | 'excel' | 'word';
  auditId: string;
  companyId: string;
}

class ReportService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  private getMimeType(format: 'pdf' | 'excel' | 'word'): string {
    switch (format) {
      case 'pdf':
        return 'application/pdf';
      case 'excel':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'word':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      default:
        return 'application/octet-stream';
    }
  }

  private getExtension(format: 'pdf' | 'excel' | 'word'): string {
    switch (format) {
      case 'pdf':
        return 'pdf';
      case 'excel':
        return 'xlsx';
      case 'word':
        return 'docx';
      default:
        return 'bin';
    }
  }

  async downloadAuditReport(options: ReportOptions): Promise<void> {
    try {
      const { format, auditId, companyId } = options;

      const response = await axios.get(
        `${API_URL}/audits/${companyId}/${auditId}/report/${format}`,
        {
          headers: this.getAuthHeaders(),
          responseType: 'blob', // 🔑 important
        }
      );

      const mimeType = this.getMimeType(format);
      const extension = this.getExtension(format);

      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Get audit details for filename
      let filename = `audit_report_${auditId}`;
      const auditResponse = await fetch(
        `${API_URL}/audits/${companyId}/${auditId}`,
        { headers: this.getAuthHeaders() }
      );
      if (auditResponse.ok) {
        const auditData = await auditResponse.json();
        if (auditData?.audit?.auditNumber) {
          filename = `Audit_Report_${auditData.audit.auditNumber}`;
        }
      }

      link.download = `${filename}.${extension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      store.dispatch(
        addNotification({
          type: 'success',
          message: `${format.toUpperCase()} report downloaded successfully`,
        })
      );
    } catch (error: any) {
      console.error('Report download error:', error);
      store.dispatch(
        addNotification({
          type: 'error',
          message:
            error.message ||
            `Failed to download ${options.format.toUpperCase()} report`,
        })
      );
    }
  }

  async downloadObservationReport(
    companyId: string,
    auditId: string,
    format: 'pdf' | 'excel' | 'word'
  ): Promise<void> {
    try {
      const response = await fetch(
        `${API_URL}/observations/${companyId}/audit/${auditId}/report/${format}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to generate observations ${format.toUpperCase()} report`
        );
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Observations_Report_${auditId}.${this.getExtension(
        format
      )}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      store.dispatch(
        addNotification({
          type: 'success',
          message: `Observations ${format.toUpperCase()} report downloaded successfully`,
        })
      );
    } catch (error: any) {
      console.error('Observations report download error:', error);
      store.dispatch(
        addNotification({
          type: 'error',
          message:
            error.message ||
            `Failed to download observations ${format.toUpperCase()} report`,
        })
      );
    }
  }

  async downloadTemplateReport(
    companyId: string,
    templateId: string,
    format: 'pdf' | 'excel' | 'word'
  ): Promise<void> {
    try {
      const response = await fetch(
        `${API_URL}/templates/${companyId}/${templateId}/export/${format}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to export template as ${format.toUpperCase()}`
        );
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Template_Export_${templateId}.${this.getExtension(
        format
      )}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      store.dispatch(
        addNotification({
          type: 'success',
          message: `Template exported as ${format.toUpperCase()} successfully`,
        })
      );
    } catch (error: any) {
      console.error('Template export error:', error);
      store.dispatch(
        addNotification({
          type: 'error',
          message:
            error.message ||
            `Failed to export template as ${format.toUpperCase()}`,
        })
      );
    }
  }
}

export const reportService = new ReportService();
