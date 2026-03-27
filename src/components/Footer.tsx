import { Link } from "react-router-dom";

import BrandLogo from "@/components/BrandLogo";
import { useLocale } from "@/contexts/LocaleContext";
import { LEGAL_LINKS } from "@/lib/legal";

const Footer = () => {
  const { messages } = useLocale();

  return (
    <footer className="bg-foreground py-12 text-background">
      <div className="container">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <Link to="/" className="mb-4 flex items-center gap-2">
              <BrandLogo iconClassName="h-8 w-8 rounded-lg" textClassName="text-lg text-background" />
            </Link>
            <p className="text-sm opacity-70">{messages.footer.description}</p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">{messages.footer.platform}</h4>
            <ul className="space-y-2 text-sm opacity-70">
              <li>
                <Link to="/search" className="transition-opacity hover:opacity-100">
                  {messages.footer.searchDrivers}
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="transition-opacity hover:opacity-100">
                  {messages.footer.howItWorks}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">{messages.footer.account}</h4>
            <ul className="space-y-2 text-sm opacity-70">
              <li>
                <Link to="/register" className="transition-opacity hover:opacity-100">
                  {messages.footer.register}
                </Link>
              </li>
              <li>
                <Link to="/login" className="transition-opacity hover:opacity-100">
                  {messages.footer.login}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">{messages.footer.legal}</h4>
            <ul className="space-y-2 text-sm opacity-70">
              <li>
                <Link to={LEGAL_LINKS.terms} className="transition-opacity hover:opacity-100">
                  {messages.footer.terms}
                </Link>
              </li>
              <li>
                <Link to={LEGAL_LINKS.privacy} className="transition-opacity hover:opacity-100">
                  {messages.footer.privacy}
                </Link>
              </li>
              <li>
                <Link to={LEGAL_LINKS.disclaimer} className="transition-opacity hover:opacity-100">
                  {messages.footer.disclaimer}
                </Link>
              </li>
              <li>
                <Link to={LEGAL_LINKS.imprint} className="transition-opacity hover:opacity-100">
                  {messages.footer.imprint}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-background/10 pt-8 text-center text-sm opacity-50">
          {messages.footer.copyright(new Date().getFullYear())}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
