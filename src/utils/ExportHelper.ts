import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { StorageService, STORAGE_KEYS } from '../services/StorageService';

export class ExportHelper {
  
  static async exportToCSV(): Promise<boolean> {
    try {
      const todos = await StorageService.getItem(STORAGE_KEYS.TODOS) || [];
      const calendar = await StorageService.getItem(STORAGE_KEYS.CALENDAR) || {};
      const medicines = await StorageService.getItem('offline_medicines') || [];
      
      let csvContent = "Date,Type,Value,Details\n";
      
      // Add Todos
      todos.forEach((t: any) => {
        const date = t.completed_at ? new Date(t.completed_at).toISOString().split('T')[0] : (t.due_date ? new Date(t.due_date).toISOString().split('T')[0] : 'No Date');
        csvContent += `${date},Todo,${(t.title || '').replace(/,/g, ' ')},Completed: ${t.is_completed}\n`;
      });
      
      // Add Logs
      Object.keys(calendar).forEach(date => {
        const log = calendar[date];
        csvContent += `${date},DailyLog,${log.day_type || 'NONE'},Notes: ${(log.notes || '').replace(/,/g, ' ')}\n`;
      });
      
      // Add Medicines
      medicines.forEach((m: any) => {
         csvContent += `-,Medicine,${(m.name || '').replace(/,/g, ' ')},Dosage: ${(m.dosage || '').replace(/,/g, ' ')}\n`;
      });
      
      const fs: any = FileSystem;
      const fileUri = fs.documentDirectory + "pace_data_export.csv";
      await fs.writeAsStringAsync(fileUri, csvContent, { encoding: fs.EncodingType.UTF8 });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { dialogTitle: 'Export Pace Data' });
        return true;
      }
      return false;
    } catch (e) {
      console.error('CSV Export Error:', e);
      return false;
    }
  }

  static async exportToPDF(): Promise<boolean> {
    try {
      const stats = await StorageService.calculate7DayStats();
      const todos = await StorageService.getItem(STORAGE_KEYS.TODOS) || [];
      
      const completedTodos = todos.filter((t: any) => t.is_completed).length;
      
      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
              h1 { color: #8679D3; }
              .stat-box { background: #f4f4f4; padding: 20px; border-radius: 10px; margin: 10px 0; }
              .footer { margin-top: 50px; font-size: 12px; color: #888; }
            </style>
          </head>
          <body>
            <h1>Pace Health Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
            
            <div class="stat-box">
              <h3>Last 7 Days Summary</h3>
              <p>Current Streak: <b>${stats.streak} Days</b></p>
              <p>Tasks Completed: <b>${stats.totalTasks}</b></p>
              <p>Calm Days: <b>${stats.calmDays}</b></p>
            </div>
            
            <div class="stat-box">
              <h3>All-Time History</h3>
              <p>Total Tasks Completed: <b>${completedTodos}</b></p>
            </div>
            
            <div class="footer">
              Exported from Pace - Your personalized health management companion.
            </div>
          </body>
        </html>
      `;
      
      const { uri } = await Print.printToFileAsync({ html: htmlContent, base64: false });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { dialogTitle: 'Export Pace PDF Report' });
        return true;
      }
      return false;
    } catch (e) {
      console.error('PDF Export Error:', e);
      return false;
    }
  }
}
