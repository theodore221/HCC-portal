/**
 * New Booking Form for Customer Portal
 * Multi-step form with ability to copy from previous bookings
 */

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import { submitPortalBooking } from './actions';
import { generateTimeToken, HoneypotField, HONEYPOT_FIELDS } from '@/lib/security/client';

interface PreviousBooking {
  id: string;
  reference: string | null;
  event_type: string;
  booking_type: string;
  arrival_date: string;
  departure_date: string;
  headcount: number;
  whole_centre: boolean;
  is_overnight: boolean;
  catering_required: boolean;
  notes: string | null;
  status: string;
}

interface NewBookingFormProps {
  csrfToken: string;
  customerEmail: string;
  customerName: string;
  previousBookings: PreviousBooking[];
}

type Step = 1 | 2 | 3;

export function NewBookingForm({
  csrfToken,
  customerEmail,
  customerName,
  previousBookings,
}: NewBookingFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<any>(null);
  const [timeToken] = useState(() => generateTimeToken());

  // Form state
  const [formData, setFormData] = useState({
    booking_type: '',
    organization: '',
    contact_phone: '',
    event_type: '',
    arrival_date: '',
    departure_date: '',
    headcount: '',
    minors: false,
    whole_centre: false,
    is_overnight: false,
    catering_required: false,
    notes: '',
  });

  const steps = ['Event Details', 'Venue & Services', 'Review & Submit'];

  const handleCopyFromPrevious = (booking: PreviousBooking) => {
    setFormData({
      ...formData,
      booking_type: booking.booking_type,
      event_type: booking.event_type,
      headcount: booking.headcount.toString(),
      whole_centre: booking.whole_centre,
      is_overnight: booking.is_overnight,
      catering_required: booking.catering_required,
      notes: booking.notes || '',
    });
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep((currentStep + 1) as Step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      submitData.append(key, value.toString());
    });
    submitData.append('_form_time', timeToken);
    submitData.append(HONEYPOT_FIELDS.booking, '');

    startTransition(async () => {
      const submitResult = await submitPortalBooking(submitData);
      setResult(submitResult);
      if (submitResult.success) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  };

  // Success state
  if (result?.success) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-green-100 p-4 mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Booking Submitted!</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your booking reference is <strong>{result.reference}</strong>.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              We'll review your booking and contact you at <strong>{customerEmail}</strong> shortly.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => router.push('/portal')}>
                View My Bookings
              </Button>
              <Button variant="outline" onClick={() => {
                setResult(null);
                setFormData({
                  booking_type: '',
                  organization: '',
                  contact_phone: '',
                  event_type: '',
                  arrival_date: '',
                  departure_date: '',
                  headcount: '',
                  minors: false,
                  whole_centre: false,
                  is_overnight: false,
                  catering_required: false,
                  notes: '',
                });
                setCurrentStep(1);
              }}>
                Create Another Booking
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Previous Bookings Reference */}
      {previousBookings.length > 0 && currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Copy from Previous Booking</CardTitle>
            <CardDescription>
              Click on a previous booking to copy its details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {previousBookings.map((booking) => (
                <button
                  key={booking.id}
                  type="button"
                  onClick={() => handleCopyFromPrevious(booking)}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 text-left transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{booking.event_type}</span>
                      <Badge variant="outline" className="text-xs">
                        {booking.reference}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(booking.arrival_date).toLocaleDateString()} • {booking.headcount} guests
                    </p>
                  </div>
                  <Copy className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-6">
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-center flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              idx + 1 === currentStep ? 'bg-primary text-primary-foreground' :
              idx + 1 < currentStep ? 'bg-green-600 text-white' :
              'bg-gray-200 text-gray-600'
            }`}>
              {idx + 1}
            </div>
            {idx < steps.length - 1 && (
              <div className={`flex-1 h-1 mx-2 ${
                idx + 1 < currentStep ? 'bg-green-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Error message */}
      {result?.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{result.error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Step {currentStep}: {steps[currentStep - 1]}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <HoneypotField name={HONEYPOT_FIELDS.booking} />
            <input type="hidden" name="_form_time" value={timeToken} />

            {/* Step 1: Event Details */}
            {currentStep === 1 && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="booking_type">Booking Type *</Label>
                    <Select
                      value={formData.booking_type}
                      onValueChange={(value) => setFormData({ ...formData, booking_type: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Group">Group</SelectItem>
                        <SelectItem value="Individual">Individual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="event_type">Event Type *</Label>
                    <Select
                      value={formData.event_type}
                      onValueChange={(value) => setFormData({ ...formData, event_type: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Retreat">Retreat</SelectItem>
                        <SelectItem value="Conference">Conference</SelectItem>
                        <SelectItem value="School">School</SelectItem>
                        <SelectItem value="Wedding">Wedding</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organization">Organization / Group Name</Label>
                  <Input
                    id="organization"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Contact Phone *</Label>
                  <Input
                    id="contact_phone"
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="arrival_date">Arrival Date *</Label>
                    <Input
                      id="arrival_date"
                      type="date"
                      value={formData.arrival_date}
                      onChange={(e) => setFormData({ ...formData, arrival_date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="departure_date">Departure Date *</Label>
                    <Input
                      id="departure_date"
                      type="date"
                      value={formData.departure_date}
                      onChange={(e) => setFormData({ ...formData, departure_date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="headcount">Total Guests *</Label>
                  <Input
                    id="headcount"
                    type="number"
                    min="1"
                    value={formData.headcount}
                    onChange={(e) => setFormData({ ...formData, headcount: e.target.value })}
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="minors"
                    checked={formData.minors}
                    onChange={(e) => setFormData({ ...formData, minors: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="minors" className="font-normal cursor-pointer">
                    Group includes children or adults with care requirements
                  </Label>
                </div>
              </>
            )}

            {/* Step 2: Venue & Services */}
            {currentStep === 2 && (
              <>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="whole_centre"
                      checked={formData.whole_centre}
                      onChange={(e) => setFormData({ ...formData, whole_centre: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="whole_centre" className="font-normal cursor-pointer">
                      Exclusive use of entire centre
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_overnight"
                      checked={formData.is_overnight}
                      onChange={(e) => setFormData({ ...formData, is_overnight: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="is_overnight" className="font-normal cursor-pointer">
                      Overnight accommodation required
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="catering_required"
                      checked={formData.catering_required}
                      onChange={(e) => setFormData({ ...formData, catering_required: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="catering_required" className="font-normal cursor-pointer">
                      Catering required
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Special Requests or Notes</Label>
                  <Textarea
                    id="notes"
                    rows={4}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any special requirements or requests..."
                  />
                </div>
              </>
            )}

            {/* Step 3: Review */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please review your booking details below. Your booking will be submitted for admin review.
                  </AlertDescription>
                </Alert>

                <div className="bg-gray-50 p-4 rounded-lg space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Email:</span>
                    <span>{customerEmail}</span>

                    <span className="font-medium">Name:</span>
                    <span>{customerName}</span>

                    <span className="font-medium">Booking Type:</span>
                    <span>{formData.booking_type}</span>

                    <span className="font-medium">Event Type:</span>
                    <span>{formData.event_type}</span>

                    {formData.organization && (
                      <>
                        <span className="font-medium">Organization:</span>
                        <span>{formData.organization}</span>
                      </>
                    )}

                    <span className="font-medium">Phone:</span>
                    <span>{formData.contact_phone}</span>

                    <span className="font-medium">Dates:</span>
                    <span>
                      {formData.arrival_date} to {formData.departure_date}
                    </span>

                    <span className="font-medium">Guests:</span>
                    <span>{formData.headcount}</span>

                    <span className="font-medium">Services:</span>
                    <span>
                      {[
                        formData.whole_centre && 'Exclusive Centre',
                        formData.is_overnight && 'Accommodation',
                        formData.catering_required && 'Catering',
                      ].filter(Boolean).join(', ') || 'None'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="terms_accepted"
                    required
                    className="mt-1 rounded border-gray-300"
                  />
                  <Label htmlFor="terms_accepted" className="font-normal cursor-pointer text-sm">
                    I have read and agree to the Holy Cross Centre Terms & Conditions *
                  </Label>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || isPending}
          >
            Back
          </Button>

          {currentStep < 3 ? (
            <Button type="button" onClick={handleNext} disabled={isPending}>
              Next
            </Button>
          ) : (
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Submitting...' : 'Submit Booking'}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
