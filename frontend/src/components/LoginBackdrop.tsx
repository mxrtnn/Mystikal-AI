import { Image, MoonStar, Sparkles } from 'lucide-react';
import hero from '../assets/hero.png';
import './LoginBackdrop.css';
export default function LoginBackdrop() {
  return <div className="login-artwork" aria-hidden="true">
    <div className="login-float login-float-one"><div className="login-art login-art-landscape"><div className="art-moon" /><div className="art-mountains" /><span>✦</span><Image size={17} /></div></div>
    <div className="login-float login-float-two"><img src={hero} alt="" /></div>
    <div className="login-float login-float-three"><div className="login-art login-art-orbit"><div className="art-planet" /><div className="art-ring" /><Sparkles size={21} /></div></div>
    <div className="login-float login-float-four"><div className="login-art login-art-landscape art-pink"><div className="art-moon" /><div className="art-mountains" /><MoonStar size={17} /></div></div>
    <div className="login-float login-float-five"><img src={hero} alt="" /></div>
    <div className="login-artwork-vignette" />
  </div>;
}
