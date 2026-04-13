interface TwilioCallOptions {
  to: string;
  from: string;
  answerUrl: string;
  statusCallbackUrl: string;
  amdCallbackUrl?: string;
}

export async function createTwilioCall(options: TwilioCallOptions): Promise<{ sid: string; status: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const authToken = process.env.TWILIO_AUTH_TOKEN!;
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  const params = new URLSearchParams({
    To: options.to,
    From: options.from,
    Url: options.answerUrl,
    StatusCallback: options.statusCallbackUrl,
    StatusCallbackMethod: 'POST',
    StatusCallbackEvent: 'initiated ringing answered completed',
  });

  if (options.amdCallbackUrl) {
    params.set('MachineDetection', 'Enable');
    params.set('AsyncAmd', 'true');
    params.set('AsyncAmdStatusCallback', options.amdCallbackUrl);
  }

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Twilio API error (${response.status}): ${errorText}`);
  }

  const data: any = await response.json();
  return { sid: data.sid, status: data.status };
}

export async function sendVerificationCode(phoneNumber: string): Promise<{ status: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const authToken = process.env.TWILIO_AUTH_TOKEN!;
  const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID!;
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  const response = await fetch(
    `https://verify.twilio.com/v2/Services/${verifySid}/Verifications`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: phoneNumber, Channel: 'sms' }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Twilio Verify error (${response.status}): ${errorText}`);
  }

  const data: any = await response.json();
  return { status: data.status };
}

export async function checkVerificationCode(phoneNumber: string, code: string): Promise<{ status: string; valid: boolean }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const authToken = process.env.TWILIO_AUTH_TOKEN!;
  const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID!;
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  const response = await fetch(
    `https://verify.twilio.com/v2/Services/${verifySid}/VerificationChecks`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: phoneNumber, Code: code }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Twilio Verify check error (${response.status}): ${errorText}`);
  }

  const data: any = await response.json();
  return { status: data.status, valid: data.status === 'approved' };
}
