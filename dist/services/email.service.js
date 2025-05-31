"use strict";
// Mock email service for DigiWallet
// In a production environment, this would be replaced with a real email service like SendGrid, Mailgun, etc.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTransactionAlert = exports.sendEmailAlert = void 0;
/**
 * Send an email alert (mocked implementation)
 * @param to Recipient email address
 * @param subject Email subject
 * @param body Email body content
 * @returns Promise resolving to success message
 */
const sendEmailAlert = (to, subject, body) => __awaiter(void 0, void 0, void 0, function* () {
    // In a real implementation, this would connect to an email service
    console.log('MOCK EMAIL SENT:');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);
    console.log('-------------------');
    // Simulate network delay
    yield new Promise(resolve => setTimeout(resolve, 500));
    return 'Email sent successfully';
});
exports.sendEmailAlert = sendEmailAlert;
/**
 * Send a transaction alert email
 * @param to Recipient email address
 * @param transactionType Type of transaction (deposit, withdrawal, transfer)
 * @param amount Transaction amount
 * @param currency Currency code
 * @param isSuspicious Whether the transaction was flagged as suspicious
 * @returns Promise resolving to success message
 */
const sendTransactionAlert = (to, transactionType, amount, currency, isSuspicious) => __awaiter(void 0, void 0, void 0, function* () {
    const subject = isSuspicious
        ? `⚠️ SUSPICIOUS ${transactionType.toUpperCase()} ALERT`
        : `DigiWallet ${transactionType.toUpperCase()} Confirmation`;
    const body = isSuspicious
        ? `A suspicious ${transactionType} of ${amount} ${currency} has been detected on your account. If you did not authorize this transaction, please contact support immediately.`
        : `Your ${transactionType} of ${amount} ${currency} has been processed successfully.`;
    return (0, exports.sendEmailAlert)(to, subject, body);
});
exports.sendTransactionAlert = sendTransactionAlert;
