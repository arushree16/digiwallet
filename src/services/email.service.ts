// Mock email service for DigiWallet
// In a production environment, this would be replaced with a real email service like SendGrid, Mailgun, etc.

/**
 * Send an email alert (mocked implementation)
 * @param to Recipient email address
 * @param subject Email subject
 * @param body Email body content
 * @returns Promise resolving to success message
 */
export const sendEmailAlert = async (to: string, subject: string, body: string): Promise<string> => {
  // In a real implementation, this would connect to an email service
  console.log('MOCK EMAIL SENT:');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${body}`);
  console.log('-------------------');
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return 'Email sent successfully';
};

/**
 * Send a transaction alert email
 * @param to Recipient email address
 * @param transactionType Type of transaction (deposit, withdrawal, transfer)
 * @param amount Transaction amount
 * @param currency Currency code
 * @param isSuspicious Whether the transaction was flagged as suspicious
 * @returns Promise resolving to success message
 */
export const sendTransactionAlert = async (
  to: string,
  transactionType: string,
  amount: number,
  currency: string,
  isSuspicious: boolean
): Promise<string> => {
  const subject = isSuspicious 
    ? `⚠️ SUSPICIOUS ${transactionType.toUpperCase()} ALERT` 
    : `DigiWallet ${transactionType.toUpperCase()} Confirmation`;
  
  const body = isSuspicious
    ? `A suspicious ${transactionType} of ${amount} ${currency} has been detected on your account. If you did not authorize this transaction, please contact support immediately.`
    : `Your ${transactionType} of ${amount} ${currency} has been processed successfully.`;
  
  return sendEmailAlert(to, subject, body);
};
