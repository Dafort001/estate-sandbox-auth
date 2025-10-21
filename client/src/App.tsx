import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Gallery from "@/pages/gallery";
import Blog from "@/pages/blog";
import BlogPost from "@/pages/blog-post";
import OrderForm from "@/pages/order-form";
import Imprint from "@/pages/imprint";
import AGB from "@/pages/agb";
import Contact from "@/pages/contact";
import Pricing from "@/pages/pricing";
import Intake from "@/pages/intake";
import Jobs from "@/pages/jobs";
import Review from "@/pages/review";
import Preisliste from "@/pages/preisliste";
import Booking from "@/pages/booking";
import BookingConfirmation from "@/pages/booking-confirmation";
import Galerie from "@/pages/galerie";
import Datenschutz from "@/pages/datenschutz";
import KontaktFormular from "@/pages/kontakt-formular";
import About from "@/pages/about";
import FAQ from "@/pages/faq";
import Downloads from "@/pages/downloads";
import AdminEditorial from "@/pages/admin-editorial";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/gallery" component={Gallery} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/order" component={OrderForm} />
      <Route path="/impressum" component={Imprint} />
      <Route path="/agb" component={AGB} />
      <Route path="/kontakt" component={Contact} />
      <Route path="/datenschutz" component={Datenschutz} />
      <Route path="/kontakt-formular" component={KontaktFormular} />
      <Route path="/about" component={About} />
      <Route path="/faq" component={FAQ} />
      <Route path="/preise" component={Pricing} />
      <Route path="/preisliste" component={Preisliste} />
      <Route path="/buchen" component={Booking} />
      <Route path="/booking-confirmation" component={BookingConfirmation} />
      <Route path="/galerie" component={Galerie} />
      <Route path="/downloads" component={Downloads} />
      <Route path="/intake" component={Intake} />
      <Route path="/jobs" component={Jobs} />
      <Route path="/review/:jobId/:shootId" component={Review} />
      <Route path="/admin/editorial" component={AdminEditorial} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
