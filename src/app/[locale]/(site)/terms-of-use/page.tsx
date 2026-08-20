import { notFound } from "next/navigation";
import {
  ShieldCheck,
  FileText,
  CreditCard,
  Clock3,
  Plane,
  Users,
  AlertTriangle,
  Landmark,
  Mail,
  CheckCircle2,
} from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";

const sections = [
  {
    id: "introduction",
    title: "1. Introduction",
    icon: FileText,
    paragraphs: [
      'These Terms of Use ("Terms") govern your access to and use of the Taxi LogicMoov website, online booking platform, mobile applications, and related transportation services (collectively, the "Services") operated by Taxi LogicMoov ("LogicMoov," "we," "us," or "our").',
      "By accessing our website, creating an account, making a booking, or using our Services, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy.",
      "If you do not agree with these Terms, please do not use our Services.",
    ],
  },
  {
    id: "our-services",
    title: "2. Our Services",
    icon: ShieldCheck,
    paragraphs: [
      "LogicMoov provides taxi, limousine, airport transfer, and other passenger transportation booking services in Quebec, Canada.",
      "Depending on the service selected, transportation may be provided by LogicMoov directly or by an independent driver, chauffeur, or transportation service provider affiliated with or assigned through the LogicMoov platform.",
      "We reserve the right to modify, suspend, or discontinue any portion of our Services at any time where reasonably necessary.",
    ],
  },
  {
    id: "eligibility",
    title: "3. Eligibility",
    icon: Users,
    paragraphs: [
      "To use our Services and make a booking, you must provide accurate and complete information, be legally capable of entering into a binding agreement, provide a valid telephone number and email address where required, comply with all applicable laws and regulations, and use the Services only for lawful purposes.",
      "If you make a booking on behalf of another passenger, you are responsible for ensuring that the passenger is aware of and agrees to these Terms.",
    ],
  },
  {
    id: "account-and-booking",
    title: "4. Account and Booking Information",
    icon: FileText,
    paragraphs: [
      "When making a booking, you may be required to provide information such as passenger name, telephone number, email address, pickup location, destination, date and time of travel, number of passengers, luggage requirements, vehicle category, child or infant requirements, and special requests.",
      "You are responsible for ensuring that all information provided is accurate. Incorrect pickup locations, telephone numbers, passenger information, or other booking details may result in delays, additional charges, cancellation, or inability to provide the requested service.",
    ],
  },
  {
    id: "booking-confirmation",
    title: "5. Booking Confirmation",
    icon: CheckCircle2,
    paragraphs: [
      "A booking is considered confirmed only after LogicMoov or its authorized booking system has issued a booking confirmation.",
      "A booking confirmation may include a booking reference number, pickup date and time, pickup location, destination, vehicle category, number of passengers, applicable fare, and additional charges, if any.",
      "LogicMoov reserves the right to contact you to verify booking information where reasonably necessary.",
    ],
  },
  {
    id: "fares-and-payment",
    title: "6. Fares and Payment",
    icon: CreditCard,
    paragraphs: [
      "The applicable fare will be displayed or communicated to you before confirmation of your booking whenever reasonably possible.",
      "Depending on the type of service, fares may be fixed fares for specific routes or airport transfers, metered or distance/time-based fares, calculated according to the selected vehicle category, or subject to additional services, fees, or applicable surcharges.",
      "Additional charges may apply for additional stops, child or infant seats, meet-and-greet services, waiting time beyond the complimentary waiting period, additional passengers where applicable, excessive or special luggage requirements, tolls or other transportation charges, or other requested services.",
      "Payments may be processed through a third-party payment provider. By providing payment information, you authorize the applicable payment provider to process the amount due for your booking.",
    ],
  },
  {
    id: "cancellation-policy",
    title: "7. Cancellation Policy",
    icon: Clock3,
    paragraphs: [
      "Unless a different cancellation policy is specifically stated at the time of booking, the following LogicMoov cancellation policy applies.",
      "More than 24 hours before pickup: You may cancel without a cancellation fee and receive a 100% refund of the booking fare.",
      "Between 24 hours and 2 hours before pickup: A cancellation fee equal to 50% of the booking fare may apply.",
      "Less than 2 hours before pickup: A cancellation fee equal to 100% of the booking fare may apply.",
      "Different cancellation conditions may apply to certain third-party bookings, promotional fares, special events, or services where specific terms were presented at the time of booking.",
    ],
  },
  {
    id: "no-show-policy",
    title: "8. No-Show Policy",
    icon: AlertTriangle,
    paragraphs: [
      "A passenger may be considered a No-Show if the passenger does not arrive at the designated pickup location within the applicable complimentary waiting period, the driver or chauffeur is unable to contact the passenger using the contact information provided, the passenger leaves the pickup location without notifying LogicMoov or the assigned driver, or the passenger otherwise fails to take the booked transportation service.",
      "No-show bookings may be non-refundable.",
    ],
  },
  {
    id: "waiting-time",
    title: "9. Complimentary Waiting Time",
    icon: Clock3,
    paragraphs: [
      "Unless otherwise specified at the time of booking, airport pickups include up to 60 minutes of complimentary waiting time following the actual flight landing time, subject to the availability of the passenger and driver.",
      "For hotel, residence, business, or other local pickups, LogicMoov provides up to 15 minutes of complimentary waiting time after the scheduled pickup time.",
      "Additional waiting-time charges may apply after the complimentary waiting period. Waiting time may be affected by flight delays, airport procedures, traffic, passenger delays, or incorrect booking information.",
    ],
  },
  {
    id: "airport-pickups",
    title: "10. Airport Pickups and Flight Information",
    icon: Plane,
    paragraphs: [
      "For airport transfers, passengers are responsible for providing accurate flight information when requested.",
      "LogicMoov may use available flight information to monitor delays and adjust pickup timing where reasonably possible. Passengers should ensure that their flight number and other travel information are accurate.",
      "LogicMoov cannot guarantee that flight monitoring or adjustments will be available for every booking or circumstance.",
    ],
  },
  {
    id: "passenger-responsibilities",
    title: "11. Passenger Responsibilities",
    icon: Users,
    paragraphs: [
      "Passengers must be ready at the designated pickup location at the scheduled time, provide accurate booking and contact information, follow reasonable instructions from the driver or chauffeur, wear seat belts where required by law, comply with applicable transportation and safety laws, treat drivers and other passengers respectfully, and ensure children are properly secured using legally required child-restraint systems.",
      "Passengers must not engage in unlawful, threatening, abusive, violent, discriminatory, or dangerous behavior. Passengers are responsible for avoiding damage to the vehicle and for notifying LogicMoov promptly about any changes to the booking.",
    ],
  },
  {
    id: "luggage-and-belongings",
    title: "12. Luggage and Personal Belongings",
    icon: FileText,
    paragraphs: [
      "Passengers are responsible for ensuring that their luggage and personal belongings are properly secured.",
      "Vehicle capacity and luggage capacity vary depending on the vehicle category selected. LogicMoov may refuse transportation where the number or size of passengers, luggage, or other items exceeds the safe capacity of the vehicle.",
      "Passengers are responsible for their personal belongings during the trip. LogicMoov is not responsible for personal belongings left in a vehicle except to the extent required by applicable law.",
    ],
  },
  {
    id: "prohibited-items",
    title: "13. Prohibited Items and Conduct",
    icon: AlertTriangle,
    paragraphs: [
      "Passengers may not bring or use items that are illegal, dangerous, or prohibited by applicable law inside a LogicMoov vehicle. This may include illegal drugs or controlled substances, explosives or hazardous materials, weapons where prohibited by law, items that create an unreasonable safety risk, or any other prohibited items under applicable law.",
      "LogicMoov and its drivers may refuse transportation where reasonably necessary for safety or legal reasons.",
    ],
  },
  {
    id: "driver-and-vehicle-assignment",
    title: "14. Driver and Vehicle Assignment",
    icon: ShieldCheck,
    paragraphs: [
      "LogicMoov may assign a driver and vehicle based on availability, booking requirements, vehicle category, location, and operational considerations.",
      "The actual vehicle provided may differ in make, model, or color from any example vehicle shown on the website, provided that the vehicle meets the applicable category and service requirements.",
      "Where reasonably necessary, LogicMoov may substitute a comparable vehicle or transportation provider.",
    ],
  },
  {
    id: "delays",
    title: "15. Delays and Unavoidable Circumstances",
    icon: Landmark,
    paragraphs: [
      "LogicMoov makes reasonable efforts to provide transportation at the scheduled time, but transportation services may be affected by circumstances beyond our reasonable control, including traffic congestion, road closures, severe weather, accidents, vehicle breakdowns, airport delays, flight disruptions, government restrictions, emergencies, public transportation disruptions, or other circumstances beyond our reasonable control.",
      "Where such circumstances occur, LogicMoov will make reasonable efforts to minimize disruption and provide alternative arrangements where possible.",
    ],
  },
  {
    id: "service-availability",
    title: "16. Service Availability",
    icon: ShieldCheck,
    paragraphs: [
      "Transportation services are subject to availability. LogicMoov does not guarantee that a particular vehicle, driver, route, pickup time, or service will always be available.",
      "We may refuse or cancel a booking where necessary due to safety concerns, operational limitations, inaccurate booking information, vehicle availability, or other legitimate reasons.",
      "If LogicMoov cancels a prepaid booking and no suitable alternative is provided, the applicable amount paid for the cancelled service will generally be refunded, subject to the circumstances and applicable law.",
    ],
  },
  {
    id: "website-use",
    title: "17. Website and Platform Use",
    icon: FileText,
    paragraphs: [
      "You agree to use the LogicMoov website and booking platform only for lawful purposes.",
      "You must not attempt to gain unauthorized access to our systems, interfere with the operation or security of the website, submit fraudulent or misleading information, make fraudulent bookings, use automated systems to abuse or overload the platform, copy or distribute website content without authorization, bypass security measures, or use the platform for any unlawful purpose.",
      "We reserve the right to suspend or restrict access to our Services where we reasonably believe that these Terms have been violated.",
    ],
  },
  {
    id: "third-party-services",
    title: "18. Third-Party Services and Payment Providers",
    icon: CreditCard,
    paragraphs: [
      "Our Services may rely on third-party providers for payment processing, mapping, communications, technology, hosting, analytics, or other services.",
      "Third-party services may be subject to their own terms and privacy policies. LogicMoov is not responsible for the independent operation, availability, or policies of third-party services, except where responsibility cannot legally be excluded.",
    ],
  },
  {
    id: "intellectual-property",
    title: "19. Intellectual Property",
    icon: ShieldCheck,
    paragraphs: [
      "All content and materials available through the LogicMoov website and platform, including logos, trademarks, text, graphics, designs, software, and other materials, are owned by or licensed to LogicMoov unless otherwise indicated.",
      "You may use our website for your personal and lawful purposes only. You may not reproduce, modify, distribute, sell, or commercially exploit our content without our prior written permission.",
    ],
  },
  {
    id: "liability",
    title: "20. Limitation of Liability",
    icon: AlertTriangle,
    paragraphs: [
      "To the maximum extent permitted by applicable law, LogicMoov will not be responsible for indirect, incidental, special, consequential, or unforeseeable losses arising from the use of our website or transportation services.",
      "Nothing in these Terms is intended to exclude or limit liability that cannot legally be excluded or limited under applicable Quebec or Canadian law.",
      "LogicMoov does not guarantee uninterrupted or error-free operation of the website or booking platform.",
    ],
  },
  {
    id: "privacy",
    title: "21. Privacy",
    icon: FileText,
    paragraphs: [
      "Your use of our Services is also subject to our Privacy Policy, which explains how we collect, use, disclose, retain, and protect personal information.",
      "By using our Services, you acknowledge that you have reviewed our Privacy Policy.",
    ],
  },
  {
    id: "complaints",
    title: "22. Complaints and Customer Support",
    icon: Mail,
    paragraphs: [
      "If you have a complaint or concern regarding a booking or transportation service, please contact us as soon as reasonably possible.",
      "We will make reasonable efforts to investigate and resolve complaints fairly and promptly. Please include your booking reference number and relevant details when contacting us about a specific booking.",
    ],
  },
  {
    id: "changes",
    title: "23. Changes to These Terms",
    icon: FileText,
    paragraphs: [
      "LogicMoov may update these Terms from time to time to reflect changes to our Services, business practices, technology, or applicable legal requirements.",
      "The updated Terms will be posted on our website with a revised Effective Date.",
      "Your continued use of our Services after the updated Terms become effective constitutes acceptance of the revised Terms, to the extent permitted by applicable law.",
    ],
  },
  {
    id: "governing-law",
    title: "24. Governing Law",
    icon: Landmark,
    paragraphs: [
      "These Terms are governed by the laws applicable in the Province of Quebec and the applicable laws of Canada.",
      "Any dispute arising from or relating to these Terms or the Services will be subject to the applicable courts and legal procedures of Quebec, subject to any mandatory rights or remedies available to consumers under applicable law.",
    ],
  },
  {
    id: "severability",
    title: "25. Severability",
    icon: FileText,
    paragraphs: [
      "If any provision of these Terms is determined to be invalid, unlawful, or unenforceable, that provision will be interpreted or modified to the extent necessary to make it enforceable, where permitted by law.",
      "The remaining provisions will continue to apply.",
    ],
  },
  {
    id: "entire-agreement",
    title: "26. Entire Agreement",
    icon: FileText,
    paragraphs: [
      "These Terms, together with our Privacy Policy and any specific booking terms presented to you at the time of booking, constitute the agreement governing your use of the LogicMoov Services, except where additional written terms apply.",
    ],
  },
  {
    id: "contact-us",
    title: "27. Contact Us",
    icon: Mail,
    paragraphs: [
      "If you have any questions regarding these Terms of Use, please contact Taxi LogicMoov at info@logicmoov.ca.",
      "Quebec, Canada",
    ],
  },
];

export default async function TermsOfUsePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const typedLocale = locale as Locale;

  return (
    <>
      <section className="bg-ink-950 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-400">
            {typedLocale === "fr" ? "Conditions d’utilisation" : "Terms of Use"}
          </p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            {typedLocale === "fr" ? "Conditions d’utilisation" : "Terms of Use"}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-ink-300">
            {typedLocale === "fr"
              ? "Date d’effet : 13 août 2026"
              : "Effective Date: August 13, 2026"}
          </p>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-brand-200 bg-brand-50 p-6 text-sm text-ink-700">
            <p className="font-semibold text-ink-900">
              {typedLocale === "fr" ? "Introduction" : "Introduction"}
            </p>
            <p className="mt-2 leading-relaxed">
              {typedLocale === "fr"
                ? "Ces conditions régissent votre accès et votre utilisation des services Taxi LogicMoov. En utilisant notre plateforme, vous confirmez avoir lu, compris et accepté les règles applicables à votre réservation et à votre expérience de service."
                : "These Terms govern your access to and use of the Taxi LogicMoov Services. By using our platform, you confirm that you have read, understood, and accepted the rules governing your booking and service experience."}
            </p>
          </div>

          <div className="mt-8 space-y-8">
            {sections.map((section) => {
              const Icon = section.icon;

              return (
                <article
                  key={section.id}
                  className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="flex-1">
                      <h2 className="text-2xl font-extrabold text-ink-900">{section.title}</h2>
                      <div className="mt-4 space-y-3 text-base leading-relaxed text-ink-700">
                        {section.paragraphs.map((paragraph, index) => (
                          <p key={`${section.id}-${index}`}>{paragraph}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-10 rounded-2xl border border-ink-100 bg-ink-50 p-8">
            <h2 className="text-2xl font-extrabold text-ink-900">
              {typedLocale === "fr" ? "Contactez-nous" : "Contact us"}
            </h2>
            <div className="mt-4 space-y-2 text-base text-ink-700">
              <p>
                <strong>Taxi LogicMoov</strong>
              </p>
              <p>
                <a href="mailto:info@logicmoov.ca" className="font-semibold text-brand-600 hover:text-brand-700">
                  info@logicmoov.ca
                </a>
              </p>
              <p>Quebec, Canada</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
