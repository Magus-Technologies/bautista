export default function AppLogoIcon(props: React.ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img 
            src="/esama.png" 
            alt="Logo" 
            {...props}
            className={props.className}
        />
    );
}
