import type {Metadata,Viewport} from "next";
import "./globals.css";
import "./iphone.css";
import "./auth.css";
import BottomNav from "@/components/BottomNav";
import AuthGate from "@/components/AuthGate";

export const metadata:Metadata={
  title:"RM Assist",
  description:"Gestão de serviços de climatização",
  applicationName:"RM Assist",
  appleWebApp:{capable:true,statusBarStyle:"default",title:"RM Assist"},
  icons:{icon:"/icons/rm-assist-logo.png",apple:"/icons/rm-assist-logo.png"}
};

export const viewport:Viewport={themeColor:"#0a84ff",width:"device-width",initialScale:1,viewportFit:"cover"};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="pt-BR"><body>
    <AuthGate>
      <div className="app-shell"><main className="content">{children}</main><BottomNav/></div>
    </AuthGate>
  </body></html>
}
