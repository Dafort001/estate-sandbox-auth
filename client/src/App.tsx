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
      <Route path="/preise" component={Pricing} />
      <Route path="/preisliste" component={Preisliste} />
      <Route path="/booking" component={Booking} />
      <Route path="/intake" component={Intake} />
      <Route path="/jobs" component={Jobs} />
      <Route path="/review/:jobId/:shootId" component={Review} />
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
