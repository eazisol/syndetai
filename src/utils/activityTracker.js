import { logEvent } from "./eventLogger";

export const EVENTS = {
  INVESTOR: {
    SUBMISSION_CREATED: "investor.submission.created",
    SUBMISSION_APPROVED: "investor.submission.approved",
    SUBMISSION_DECLINED: "investor.submission.declined",
    SUBMISSION_WAITLISTED: "investor.submission.waitlisted",
    SUBMISSION_REACTIVATED: "investor.submission.reactivated",
    
    ACCOUNT_CREATED: "investor.account.created",
    USER_CREATED: "investor.user.created",
    
    REPORT_REQUESTED: "investor.report.requested",
    REPORT_GENERATION_STARTED: "investor.report.generation_started",
    REPORT_GENERATION_COMPLETED: "investor.report.generation_completed",
    REPORT_GENERATION_FAILED: "investor.report.generation_failed",
    REPORT_REVIEW_APPROVED: "investor.report.review_approved",
    REPORT_REVIEW_REJECTED: "investor.report.review_rejected",
    REPORT_DELIVERED: "investor.report.delivered",
    
    USER_LOGIN: "investor.user.login",
    USER_LOGIN_FAILED: "investor.user.login_failed",
    REPORT_VIEWED: "investor.report.viewed",
    REPORT_DOWNLOADED: "investor.report.downloaded",
  },
  
  FOUNDER: {
    SUBMISSION_CREATED: "founder.submission.created",
    SUBMISSION_APPROVED: "founder.submission.approved",
    SUBMISSION_DECLINED: "founder.submission.declined",
    SUBMISSION_WAITLISTED: "founder.submission.waitlisted",
    SUBMISSION_REACTIVATED: "founder.submission.reactivated",
    
    ACCOUNT_CREATED: "founder.account.created",
    USER_CREATED: "founder.user.created",
    
    PRODUCT_PURCHASED: "founder.product.purchased",
    PAYMENT_COMPLETED: "founder.payment.completed",
    
    REPORT_REQUESTED: "founder.report.requested",
    REPORT_GENERATION_STARTED: "founder.report.generation_started",
    REPORT_GENERATION_COMPLETED: "founder.report.generation_completed",
    REPORT_GENERATION_FAILED: "founder.report.generation_failed",
    REPORT_REVIEW_APPROVED: "founder.report.review_approved",
    REPORT_REVIEW_REJECTED: "founder.report.review_rejected",
    REPORT_DELIVERED: "founder.report.delivered",
    
    USER_LOGIN: "founder.user.login",
    USER_LOGIN_FAILED: "founder.user.login_failed",
    REPORT_VIEWED: "founder.report.viewed",
    REPORT_DOWNLOADED: "founder.report.downloaded",
  },
  
  TEASER: {
    VIEWED: "teaser.viewed",
    GENERATED: "teaser.generated",
    OPEN_FULL_REPORT: "teaser.open_full_report"
  }
};

/**
 * Enhanced tracker function integrating with the existing eventLogger.
 * @param {string} eventName - Uses the EVENTS dictionary (e.g. EVENTS.INVESTOR.SUBMISSION_CREATED)
 * @param {Object} payload - { companyId, userId, organisationId, reportId, campaignId }
 */
export async function trackActivity(eventName, payload = {}) {
  await logEvent({
    eventType: eventName,
    companyId: payload.companyId || null,
    userId: payload.userId || null,
    organisationId: payload.organisationId || null,
    reportId: payload.reportId || null,
    campaignId: payload.campaignId || null,
    submissionId: payload.submissionId || null,
    subscriptionId: payload.subscriptionId || null,
    metadata: payload.metadata || null,
  });
}
