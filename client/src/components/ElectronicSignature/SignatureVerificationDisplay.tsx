// Shows verification results visually
export function SignatureVerificationDisplay({ verificationResult }) {
  return (
    <Card>
      <CardContent>
        <Badge>Trust Level: {verificationResult.trustLevel}%</Badge>
        <Badge>Compliance: {verificationResult.complianceLevel}</Badge>
        {/* Visual display of verification status */}
      </CardContent>
    </Card>
  );
}