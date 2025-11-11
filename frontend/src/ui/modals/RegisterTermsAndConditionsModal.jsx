import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

const RegisterTermsAndConditionsModal = ({ open, onClose, onAgree }) => {
  const handleAgree = () => {
    onAgree();
    // Ensure focus is properly managed
    setTimeout(() => {
      if (document.activeElement) {
        document.activeElement.blur();
      }
    }, 100);
  };

  const handleClose = () => {
    onClose();
    // Ensure focus is properly managed
    setTimeout(() => {
      if (document.activeElement) {
        document.activeElement.blur();
      }
    }, 100);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableRestoreFocus={true} // Prevent focus restoration issues
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '80vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #e0e0e0',
          pb: 2,
          fontSize: '1.5rem',
          fontWeight: 'bold',
        }}
      >
        JA Car Rental Terms and Conditions
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        <div className="space-y-6">
          {/* Introduction Section */}
          <div>
            <Typography
              variant="h6"
              sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2' }}
            ></Typography>
            <Typography variant="body2" sx={{ lineHeight: 1.6, mb: 2 }}>
              This Car Rental Agreement is made between JA Car Rental ("Lessor")
              and the undersigned renter ("Lessee"). By clicking "I Agree " the
              renter agrees to all the terms and conditions below.
            </Typography>
          </div>

          {/* Personal Information Collection and Consent Section */}
          <div>
            <Typography
              variant="h6"
              sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2' }}
            >
              Collection and Use of Personal Information
            </Typography>
            <Typography
              variant="body2"
              sx={{ lineHeight: 1.6, mb: 2, textAlign: 'justify' }}
            >
              By registering for an account and using our services, you
              expressly consent to the collection, use, storage, and processing
              of your personal information by JA Car Rental for legitimate
              business purposes. We are committed to protecting your privacy and
              handling your data responsibly in accordance with applicable data
              privacy laws, including the Data Privacy Act of 2012 (Republic Act
              No. 10173).
            </Typography>

            <Typography
              variant="body2"
              sx={{ fontWeight: 'bold', mb: 1, mt: 2 }}
            >
              Information We Collect:
            </Typography>
            <ul className="list-disc ml-6 space-y-1">
              <li>
                <Typography variant="body2">
                  <strong>Personal Identification Information:</strong> Full
                  name, address, contact number, email address, and Facebook
                  profile link
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>Government-Issued IDs:</strong> Driver's license
                  information (number, expiry date, restrictions) and images of
                  valid identification documents
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>Account Credentials:</strong> Username and encrypted
                  password for account access
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>Booking and Transaction Records:</strong> Rental
                  history, payment information, vehicle usage data, and service
                  preferences
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>Communication Records:</strong> Messages, inquiries,
                  feedback, and support requests
                </Typography>
              </li>
            </ul>

            <Typography
              variant="body2"
              sx={{ fontWeight: 'bold', mb: 1, mt: 2 }}
            >
              How We Use Your Information:
            </Typography>
            <ul className="list-disc ml-6 space-y-1">
              <li>
                <Typography variant="body2">
                  <strong>Service Delivery:</strong> To process and fulfill your
                  vehicle rental bookings, manage reservations, and provide
                  customer support
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>Identity Verification:</strong> To verify your
                  identity and eligibility to rent vehicles, ensuring compliance
                  with legal requirements
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>Payment Processing:</strong> To process payments,
                  issue invoices, manage security deposits, and handle refunds
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>Safety and Security:</strong> To protect our vehicles,
                  prevent fraud, investigate incidents, and ensure compliance
                  with rental agreements
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>Communication:</strong> To send booking confirmations,
                  notifications, reminders, updates about your reservations, and
                  respond to your inquiries
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>Business Operations:</strong> To maintain accurate
                  records, conduct internal analysis, improve our services, and
                  comply with legal and regulatory obligations
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>Marketing and Promotions:</strong> To inform you about
                  special offers, promotions, new services, and updates (you may
                  opt-out at any time)
                </Typography>
              </li>
            </ul>

            <Typography
              variant="body2"
              sx={{ fontWeight: 'bold', mb: 1, mt: 2 }}
            >
              Data Protection and Security:
            </Typography>
            <Typography
              variant="body2"
              sx={{ lineHeight: 1.6, mb: 1, textAlign: 'justify' }}
            >
              We implement appropriate technical and organizational measures to
              protect your personal information against unauthorized access,
              alteration, disclosure, or destruction. Your data is stored
              securely and accessed only by authorized personnel for legitimate
              business purposes.
            </Typography>

            <Typography
              variant="body2"
              sx={{ fontWeight: 'bold', mb: 1, mt: 2 }}
            >
              Data Sharing and Disclosure:
            </Typography>
            <Typography
              variant="body2"
              sx={{ lineHeight: 1.6, mb: 1, textAlign: 'justify' }}
            >
              We do not sell, trade, or rent your personal information to third
              parties. We may share your information only in the following
              circumstances:
            </Typography>
            <ul className="list-disc ml-6 space-y-1">
              <li>
                <Typography variant="body2">
                  With service providers who assist in our operations (payment
                  processors, insurance providers)
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  When required by law, court order, or government authorities
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  To protect our rights, property, safety, or the safety of
                  others
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  With your explicit consent for specific purposes
                </Typography>
              </li>
            </ul>

            <Typography
              variant="body2"
              sx={{ fontWeight: 'bold', mb: 1, mt: 2 }}
            >
              Your Rights:
            </Typography>
            <Typography
              variant="body2"
              sx={{ lineHeight: 1.6, mb: 1, textAlign: 'justify' }}
            >
              You have the right to access, correct, or request deletion of your
              personal information, subject to legal and contractual
              limitations. You may also withdraw your consent at any time,
              though this may affect your ability to use our services.
            </Typography>

            <Typography
              variant="body2"
              sx={{ fontWeight: 'bold', mb: 1, mt: 2 }}
            >
              Consent Acknowledgment:
            </Typography>
            <Typography
              variant="body2"
              sx={{
                lineHeight: 1.6,
                mb: 2,
                textAlign: 'justify',
                fontStyle: 'italic',
              }}
            >
              By clicking "I Agree" and proceeding with registration, you
              acknowledge that you have read, understood, and consent to the
              collection, use, storage, and processing of your personal
              information as described above for the legitimate business
              purposes of JA Car Rental. You confirm that you are providing
              accurate and complete information and that you have the authority
              to provide such information.
            </Typography>
          </div>

          {/* Reservation Term Section */}
          <div>
            <Typography
              variant="h6"
              sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2' }}
            >
              Reservation
            </Typography>
            <Typography variant="body2" sx={{ lineHeight: 1.6, mb: 2 }}>
              The reservation of one of our vehicles needs complete fulfillment
              of following requirements:
            </Typography>
            <ul className="list-disc ml-6 space-y-1">
              <li>
                <Typography variant="body2">
                  <strong>Full Name</strong>
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>Address</strong>
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>Contact Number</strong>
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>Atleast 2 Valid ID's or Passport</strong>
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>Proof of Billing</strong> (Hotel Invoice, Credit Card
                  Statement, Electric Bill, Etc.)
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>
                    Payment of the reservation fee of ₱1000 Non - Refundable
                  </strong>
                </Typography>
              </li>
            </ul>
            <Typography
              variant="body2"
              sx={{ lineHeight: 1.6, mb: 2, textAlign: 'justify' }}
            >
              JA Car Rental will give you a provisary confirmation note upon
              submission of the Full Name, Address, and Contact Number. The
              final confirmation will be completed with receipt of ₱1000
              reservation fee atleast 48 hours prior to the established rental
              start date and time. In case of any of above-mentioned requirement
              has not been submitted / completed, JA Car Rental reserves the
              right to rent out the car to another customer without any prior
              notice as the booking is considered as not completed.
            </Typography>
          </div>

          {/* Cancellation Policy Section */}
          <div>
            <Typography
              variant="h6"
              sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2' }}
            >
              Cancellation Policy
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, textAlign: 'justify' }}>
              For any Cancellation or No-Show, the following fees apply:
            </Typography>
            <ul className="list-disc ml-6 space-y-1">
              <li>
                <Typography variant="body2">
                  <strong>30 - 21 days ahead of rental:</strong> 100% Refundable
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>20 – 10 days ahead of rental:</strong> 75% Refundable
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>9 – 3 days ahead of rental:</strong> 50% Refundable
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>2 days or less & no show:</strong> No Refund
                </Typography>
              </li>
            </ul>
          </div>

          {/* Vehicle Identification Section */}
          <div>
            <Typography
              variant="h6"
              sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2' }}
            >
              Identification of the Rental Vehicle & Vehicle Classes
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, textAlign: 'justify' }}>
              The customer has the right to reserve and book any class of car,
              confirmed by Butuan Car Rental, but no right on a specific make,
              model, car, or color. The right is limited to the booked class of
              vehicle. BCR can switch between cars of the same class or upgrade
              the customer to the next higher class as follows:
            </Typography>
            <ul className="list-disc ml-6 space-y-1">
              <li>
                <Typography variant="body2">
                  <strong> Sedan 5-Seater Automatic -</strong> Mirage G4
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong> Sedan 5-Seater Automatic -</strong> Mirage G4
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong> Pick-up 5-Seater Manual -</strong> Nissan Navarra
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong> SUV 7-Seater Automatic -</strong> Mitsubishi Expander
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong> SUV 7-Seater Automatic -</strong> Toyota Avanza
                </Typography>
              </li>
            </ul>
          </div>

          {/* Rental Term Section */}
          <div>
            <Typography
              variant="h6"
              sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2' }}
            >
              Rental Term
            </Typography>
            <Typography
              variant="body2"
              sx={{ lineHeight: 1.6, mb: 2, textAlign: 'justify' }}
            >
              The term of this Car Rental Agreement runs from the date and hour
              of vehicle pickup as indicated in the individual Car Rental
              Agreement until the return of the vehicle to Owner and completion
              of all terms of this Car Rental Agreement by both Parties. The
              Parties may shorten or extend the estimated term of rental by
              mutual consent. A refund for early return is not applicable. In
              case of delayed return without prior notice of at least 6 hours
              ahead of the scheduled return time according to this agreement,
              the owner is eligible to consider the car as stolen. Furthermore,
              a fee of 250 PHP per hour will be imposed starting from the minute
              of the latest agreed return time. If the return delay exceeds more
              than 2 hours, a full daily rate as well as possible compensation
              for the loss of a following booking, at exactly the value of the
              lost booking, will be charged.
            </Typography>
            <Typography
              variant="body2"
              sx={{ lineHeight: 1.6, mb: 2, textAlign: 'justify' }}
            >
              Furthermore, the agreed point of return is the JA Car Rental
              Office, Brgy. Limaha, Butuan City/ where the renter and owner
              agreed upon. It's the renter's responsibility to return the car
              there. Failure to do so results in a penalty of the complete
              deposit and additional costs & fees based on an eventual loss of
              business and those costs to pick up the unit instead.
            </Typography>
          </div>
          {/* Scope of Use Section */}
          <div>
            <Typography
              variant="h6"
              sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2' }}
            >
              Scope of Use
            </Typography>
            <Typography
              variant="body2"
              sx={{ lineHeight: 1.6, mb: 2, textAlign: 'justify' }}
            >
              Renter will use the Rented Vehicle only for personal or routine
              business use and operate the Rented Vehicle only on properly
              maintained roads and parking lots. Renter will comply with all
              applicable laws relating to holding of licensure to operate the
              vehicle and pertaining to operation of motor vehicles. Renter will
              not sublease the Rental Vehicle or use it as a vehicle for hire.
              Renter will not take the vehicle outside the Mindanao. Renter will
              not use this car for driving test, test drive etc. Violation of
              this term is penalized with legal action and a fee of ₱2000 daily,
              applicable for the whole rental term. The owner is also entitled
              to equip his cars with GPS systems in order to locate his vehicles
              and prevent theft and use outside Butuan City proper. The owner
              also prohibits the renter to smoke or use any electrical smoking
              devices such as vape inside the vehicle.
            </Typography>
          </div>
          {/* Rental Fees Section */}
          <div>
            <Typography
              variant="h6"
              sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2' }}
            >
              Rental Fees and Charges
            </Typography>
            <Typography
              variant="body2"
              sx={{ lineHeight: 1.6, mb: 2, textAlign: 'justify' }}
            >
              The renter acknowledges and agrees to pay all applicable fees and
              charges associated with the vehicle rental. These fees are
              implemented to maintain the quality, safety, and reliability of
              the Company’s services and to ensure fair use of all vehicles and
              resources. All fees must be settled in accordance with the terms
              set forth in this agreement.
            </Typography>
            <Typography
              variant="body2"
              sx={{ lineHeight: 1.6, mb: 2, textAlign: 'justify' }}
            >
              Below are the applicable fees and their descriptions:
            </Typography>
            <ul className="list-disc ml-6 space-y-1">
              <li>
                <Typography variant="body2">
                  <strong>Reservation Fee -</strong> A non-refundable fee
                  collected to confirm and secure the vehicle booking. This fee
                  ensures that the selected vehicle is reserved exclusively for
                  the renter’s chosen date and time.
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>Cleaning Fee - </strong> Charged to cover the cost of
                  cleaning the vehicle after use. Additional cleaning fees may
                  apply if the vehicle is returned in an excessively dirty or
                  unsanitary condition beyond normal use.
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>Driver Fee (for bookings with a driver) - </strong>{' '}
                  Applies to rentals that include a company-provided driver.
                  This fee covers the driver’s service, time, and basic
                  transportation costs throughout the rental period.
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>Overdue Fee - </strong> A penalty charged if the
                  renter fails to return the vehicle at the agreed-upon date and
                  time. The overdue fee is calculated based on the number of
                  hours or days delayed and may include additional charges if
                  the delay affects subsequent bookings.
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>Damage Fee - </strong> Applied if the vehicle sustains
                  any damage during the rental period that is not covered by
                  insurance or the renter’s security deposit. The amount will
                  depend on the severity and estimated repair cost.
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>Equipment Loss Fee - </strong> Charged for the loss,
                  theft, or non-return of any vehicle accessories or equipment
                  (e.g., tools, GPS devices, dashcams, or spare tires) provided
                  at the start of the rental.
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>Gas Level Fee - </strong> Assessed if the vehicle is
                  returned with less fuel than it had at the time of pickup. The
                  renter will be charged based on the difference in fuel level
                  and the current fuel rate per liter.
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>Stain Removal Fee - </strong> Applied when the vehicle
                  interior (seats, carpet, upholstery, etc.) has stains, spills,
                  or odors that require professional cleaning or detailing
                  services.
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>Security Deposit Fee - </strong> A refundable amount
                  collected before the rental begins to cover potential
                  penalties, damages, or violations. The deposit will be
                  refunded in full once the vehicle is returned in good
                  condition and all rental terms are met.
                </Typography>
              </li>
            </ul>
            <Typography
              variant="body2"
              sx={{ mt: 2, mb: 2, fontStyle: 'italic', textAlign: 'justify' }}
            >
              For each level under the rental level a fee of 300 PHP to be paid
              per line. Furthermore, the car is given to the renter in a clean
              state inside and outside and without technical issues or damages
              except specified by the owner. Failure to return the car in the
              same clean state, the owner will charge a cleaning fee of minimum
              200 PHP for usual cleaning and a stain removal of 500 PHP per
              stain in case of any stains.
            </Typography>
          </div>
          {/* Driver Qualification Section */}
          <div>
            <Typography
              variant="h6"
              sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2' }}
            >
              Driver Qualification
            </Typography>
            <Typography
              variant="body2"
              sx={{ lineHeight: 1.6, mb: 2, textAlign: 'justify' }}
            >
              The renter or any designated driver must meet the following
              qualifications:
            </Typography>
            <ul className="list-disc ml-6 space-y-1">
              <li>
                <Typography variant="body2">
                  <strong>
                    The driver must present a valid and non-expired driver’s
                    license issued by the appropriate government authority.
                  </strong>
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>
                    The driver’s license must be shown at the time of vehicle
                    pickup for verification.
                  </strong>
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>
                    International renters are required to provide both their
                    home country driver’s license and an International Driving
                    Permit (IDP) if their license is not in English.
                  </strong>
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>
                    The Company reserves the right to refuse rental to any
                    individual who cannot provide the required documents or
                    whose driving history indicates potential risk.{' '}
                  </strong>
                </Typography>
              </li>
            </ul>
          </div>
          {/* Security Deposit Section */}
          <div>
            <Typography
              variant="h6"
              sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2' }}
            >
              Security Deposit
            </Typography>
            <Typography
              variant="body2"
              sx={{ lineHeight: 1.6, mb: 2, textAlign: 'justify' }}
            >
              Renter will be required to provide a security deposit to Owner in
              the amount of 3000 PHP Security Deposit as charge in the event of
              loss or damage of the Rental Vehicle during the term of this Car
              Rental Agreement. Owner may, in place of collection of a security
              deposit, place a hold on a credit card in the same amount. In the
              event of damage to the Rental Vehicle, the Owner will apply this
              Security Deposit to defray the costs of necessary repairs or
              replacement. If the costs for repair or replacement of damage to
              the Rental Vehicle exceeds the amount of the Security Deposit,
              Renter will be responsible for paying the balance Costs minus the
              deposit to the Owner. If renter will return the Vehicle in good
              state no penalties made, security deposit will be refunded.
            </Typography>
          </div>
          {/* Insurance Section */}
          <div>
            <Typography
              variant="h6"
              sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2' }}
            >
              Insurance
            </Typography>
            <Typography
              variant="body2"
              sx={{ lineHeight: 1.6, mb: 2, textAlign: 'justify' }}
            >
              The owner provides the car with an COMPREHENSIVE insurance that
              would cover damage to the Rental Vehicle at the time this Car
              Rental Agreement is signed, as well as personal injury to the
              Renter, passengers in the Rented Vehicle, and other persons or
              property. If the Rental Vehicle is damaged or destroyed while it
              is in the custody of the Renter, Renter agrees to pay any required
              insurance deductible and assign all rights to collect insurance
              proceeds to the Owner. Furthermore, the renter will pay a
              compensation of a daily rental fee per day in case of damage or
              loss for each day the car is out of usage, unavailable or in the
              garage due to the incident caused by the renter. Damages of Tires,
              Rims, Wheels, interior parts and all those which are not caused by
              an accident are not part of any insurance coverage and must be
              shouldered in full by the renter. Furthermore, damages caused by
              abuse, failure and especially under narcotic, drug alcohol
              influence are excluded from any insurance coverage. In addition,
              above in this paragraph mentioned compensation policy, on top of
              the damage costs, is applicable.
            </Typography>
          </div>
          {/* Identification Section */}
          <div>
            <Typography
              variant="h6"
              sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2' }}
            >
              Identification
            </Typography>
            <Typography
              variant="body2"
              sx={{ lineHeight: 1.6, mb: 2, textAlign: 'justify' }}
            >
              Renter agrees to indemnify, defend, and hold harmless the Owner
              for any loss, damage, or Rented Vehicle during the term of this
              Car Rental Agreement. That includes any attorney fees necessarily
              incurred for these purposes. Renter will also pay for any parking
              tickets, moving violations, or the other citations received while
              in possession of the Rented Vehicle.
            </Typography>
          </div>
          {/* Representations and Warranties Section */}
          <div>
            <Typography
              variant="h6"
              sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2' }}
            >
              Representations and Warranties
            </Typography>
            <Typography
              variant="body2"
              sx={{ lineHeight: 1.6, mb: 2, textAlign: 'justify' }}
            >
              Owner represents and warrants that to Owner's Knowledge the Rental
              Vehicle is in good condition and is safe for the ordinary
              operation of the vehicle. The Renter represents and warrants that
              Renter is legally entitled to opreate a motor vehicle under the
              laws of this jurisdiction and will not operate it in violation of
              any laws, or any negligent or illegal manner. The Renter has
              examined the Rental Vehicle in advance of taking possession of it,
              and upon such inspection, is not aware of any damage existing on
              the vehicle other than that notated by separate existing Damage
              document.
            </Typography>
          </div>
          {/* Jurisdiction and Venue Section */}
          <div>
            <Typography
              variant="h6"
              sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2' }}
            >
              Jurisdiction and Venue
            </Typography>
            <Typography
              variant="body2"
              sx={{ lineHeight: 1.6, mb: 2, textAlign: 'justify' }}
            >
              In the event of any dispute over this Car Rental Agreement, this
              Car Rental Agreement will be interpreted by the laws of the State
              of the Philippines, and any lawsuit or arbitration must be brought
              in the City of Butuan, Agusan del Norte. If any portion of this
              Car Rental Agreement is found to be unenforceable by a court of
              competent jurisdiction, the remainder of the agreement would still
              have full force and effect.
            </Typography>
          </div>
          {/* Entire Agreement Section */}
          <div>
            <Typography
              variant="h6"
              sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2' }}
            >
              Entire Agreement
            </Typography>
            <Typography
              variant="body2"
              sx={{ lineHeight: 1.6, mb: 2, textAlign: 'justify' }}
            >
              By finalizing a booking, the renter agrees to these General Terms
              and Conditions. This Car Rental Agreement constitutes the entier
              agreement between the Parties concerning this rental arrangement.
              No modification to this agreement can be made unless in writing
              signed by both Parties. Any notice required to be given to the
              other party will be made to the contact information below. This
              serves also as NDA or Non-Disclosure Agreement. No part of granted
              conditions, any communication etc. are permitted to be published
              in any kind of media or to be communicated to any 3rd party.
              Failure results in a lawsuit and a penalty of up to 10 Million
              PHP.
            </Typography>
          </div>
        </div>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid #e0e0e0' }}>
        <Button onClick={handleClose} variant="outlined" color="secondary">
          Close
        </Button>
        <Button onClick={handleAgree} variant="contained" color="primary">
          I Agree
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RegisterTermsAndConditionsModal;
