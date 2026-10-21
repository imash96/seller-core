import logger from '@adonisjs/core/services/logger'
import { DateTime } from 'luxon'
import TasksReminder from '#models/tasks_reminder'
import { TaskPriority, TaskStatus, TaskType } from '../enums/index.js'
import type RiskSignalFlagged from '#events/risk_signal_flagged'

export default class EnqueueRiskReview {
  async handle(event: InstanceType<typeof RiskSignalFlagged>) {
    const { signalId, customerId, userId, reason, severity } = event.payload
    logger.info({ signalId, customerId, severity }, '[events] risk signal -> creating fraud review task')

    try {
      await TasksReminder.create({
        userId,
        relatedEntityType: 'customer_risk_signals',
        relatedEntityId: signalId,
        taskType: TaskType.FRAUD_REVIEW,
        priority: severity === 'critical' || severity === 'high' ? TaskPriority.URGENT : TaskPriority.HIGH,
        status: TaskStatus.PENDING,
        title: `Review ${severity.toUpperCase()} Risk Signal (${signalId.slice(0, 10)})`,
        description: reason || `Manual fraud/risk review required for customer ${customerId}`,
        dueAt: DateTime.now().plus({ days: 1 }),
      })
    } catch (err) {
      logger.warn({ err, signalId }, '[events] failed to create risk review task')
    }
  }
}
