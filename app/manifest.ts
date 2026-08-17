import type {MetadataRoute} from "next";
export default function manifest(): MetadataRoute.Manifest {return {name:"RM Assist",short_name:"RM Assist",description:"Gestão de serviços de climatização",start_url:"/",display:"standalone",background_color:"#ffffff",theme_color:"#0a84ff",orientation:"portrait",icons:[{src:"/icons/rm-assist-logo.png",sizes:"512x512",type:"image/png",purpose:"any"}]}}
