import Agenda from 'agenda';

let agenda;

const initializeAgenda = async () => {
  try {
    agenda = new Agenda({
      db: { address: process.env.MONGODB_URI, collection: 'agendaJobs' },
      processEvery: '30 seconds',
      maxConcurrency: 20
    });

    // Define job types
    agenda.define('send hira reminder', require('../jobs/hiraReminder'));
    agenda.define('send approval reminder', require('../jobs/approvalReminder'));
    agenda.define('send weekly report', require('../jobs/weeklyReport'));
    agenda.define('cleanup expired tokens', require('../jobs/cleanupTokens'));

    await agenda.start();
    console.log('Agenda started successfully');

    // Schedule recurring jobs
    await agenda.every('24 hours', 'cleanup expired tokens');
    await agenda.every('0 9 * * 1', 'send weekly report');

  } catch (error) {
    console.error('Failed to initialize Agenda:', error);
  }
};

export const scheduleHiraReminder = async (hiraId, dueDate, teamMembers) => {
  if (!agenda) return;

  const now = new Date();
  const endDate = new Date(dueDate);

  // Skip if due date already passed
  if (endDate <= now) return;

  // Cancel existing reminders for this HIRA
  await agenda.cancel({ name: 'send hira reminder', 'data.hiraId': hiraId });

  // Define a unique job name
  const jobName = `send_hira_reminder_${hiraId}`;

  // Schedule daily reminders until due date
  await agenda.every(
    '24 hours',
    'send hira reminder',
    { hiraId, teamMembers, endDate },
    { jobId: jobName, startDate: now }
  );
};


export const scheduleApprovalReminder = async (hiraId, hodId, delay = '48 hours') => {
  if (!agenda) return;
  
  await agenda.schedule(`in ${delay}`, 'send approval reminder', {
    hiraId,
    hodId
  });
};

export const cancelJob = async (jobName, data) => {
  if (!agenda) return;
  
  await agenda.cancel({ name: jobName, data });
};

export default {
  initializeAgenda,
  
  scheduleHiraReminder,
  scheduleApprovalReminder,
  cancelJob,
  agenda: () => agenda
};