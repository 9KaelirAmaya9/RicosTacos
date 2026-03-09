import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { MapPin, Clock, Phone } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import logo from "@/assets/logo-illustration.png";
import DeliveryAddressValidator from "@/components/DeliveryAddressValidator";

const Location = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Navigation />
      
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="font-serif text-5xl md:text-6xl font-bold mb-6">
              {t("location.title")} <span className="text-primary">{t("location.titleHighlight")}</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("location.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-8">
            {/* Location Info */}
            <Card className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <img src={logo} alt="Ricos Tacos" className="h-16 w-16" />
                <h2 className="font-serif text-3xl font-semibold">{t("location.locationTitle")}</h2>
              </div>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <MapPin className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">{t("location.address")}</h3>
                    <p className="text-muted-foreground">
                      505 51st Street<br />
                      (entre 5ta. y 6ta. Ave.)<br />
                      Brooklyn, NY 11220
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Clock className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">{t("location.hoursTitle")}</h3>
                    <div className="text-muted-foreground space-y-1">
                      <p className="font-medium">{t("home.footer.openDays")}</p>
                      <p>{t("common.days")}: {t("common.hours")}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Phone className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">{t("location.contact")}</h3>
                    <div className="text-muted-foreground space-y-1">
                      <p>
                        <span className="font-medium">Tel:</span>{" "}
                        <a href="tel:7186334816" className="hover:text-primary transition-colors font-semibold">
                          (718) 633-4816
                        </a>
                      </p>
                      <p>
                        <span className="font-medium">Cell:</span>{" "}
                        <a href="tel:9173700430" className="hover:text-primary transition-colors font-semibold">
                          (917) 370-0430
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Google Maps */}
            <div className="h-full min-h-[400px]">
              <iframe
                title="Ricos Tacos Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3027.4268743583893!2d-74.00884492346602!3d40.65008797139283!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25af4e3f6d5b5%3A0x1234567890abcdef!2s505%2051st%20St%2C%20Brooklyn%2C%20NY%2011220!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus"
                width="100%"
                height="100%"
                style={{ border: 0, borderRadius: '0.5rem' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          {/* Delivery Address Validator */}
          <div className="max-w-4xl mx-auto mb-8">
            <DeliveryAddressValidator />
          </div>

          {/* Services */}
          <div className="mt-16 max-w-6xl mx-auto">
            <h2 className="font-serif text-3xl font-semibold mb-8 text-center">
              {t("location.services")}
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🍽️</span>
                </div>
                <h3 className="font-serif text-xl font-semibold mb-2">{t("location.dineIn")}</h3>
                <p className="text-muted-foreground">
                  {t("location.dineInDesc")}
                </p>
              </Card>

              <Card className="p-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🥡</span>
                </div>
                <h3 className="font-serif text-xl font-semibold mb-2">{t("location.takeout")}</h3>
                <p className="text-muted-foreground">
                  {t("location.takeoutDesc")}
                </p>
              </Card>

              <Card className="p-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🚗</span>
                </div>
                <h3 className="font-serif text-xl font-semibold mb-2">{t("location.freeDelivery")}</h3>
                <p className="text-muted-foreground">
                  {t("location.deliveryDesc")}
                </p>
              </Card>
            </div>
          </div>

          {/* Catering Info */}
          <Card className="mt-12 p-8 bg-gradient-to-br from-primary via-rico-red-dark to-primary text-primary-foreground max-w-4xl mx-auto shadow-elegant border-0">
            <div className="text-center">
              <h2 className="font-serif text-3xl font-semibold mb-4">
                {t("location.catering")}
              </h2>
              <p className="text-lg mb-6 opacity-90">
                {t("location.cateringTitle")}
              </p>
              <div className="space-y-2 mb-6 text-sm opacity-90">
                <p>{t("location.cateringDishes")}</p>
                <p>{t("location.cateringDishes2")}</p>
                <p>{t("location.cateringDishes3")}</p>
              </div>
              <div className="pt-4 border-t border-primary-foreground/20">
                <p className="font-semibold text-lg mb-2">{t("location.cateringContact")}</p>
                <a 
                  href="tel:9173700430" 
                  className="text-2xl font-serif font-bold hover:opacity-80 transition-opacity"
                >
                  (917) 370-0430
                </a>
                <p className="mt-2 text-sm opacity-90">{t("location.askFor")}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Location;
