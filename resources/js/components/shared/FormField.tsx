import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ReqLabel, OptLabel } from './FormLabels';

type Props = {
    label:        string;
    value:        string;
    onChange:     (v: string) => void;
    error?:       string;
    type?:        string;
    placeholder?: string;
    required?:    boolean;
    min?:         number;
    max?:         number;
    step?:        string;
    helpText?:    string;
};

export default function FormField({ label, value, onChange, error, type = 'text', placeholder, required, min, max, step, helpText }: Props) {
    const LabelComponent = required ? ReqLabel : OptLabel;

    return (
        <div className="space-y-1">
            <LabelComponent className="text-xs sm:text-sm">{label}</LabelComponent>
            {type === 'textarea' ? (
                <Textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="text-xs sm:text-sm"
                    rows={3}
                />
            ) : (
                <Input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="h-8 sm:h-9 text-xs sm:text-sm"
                    min={min}
                    max={max}
                    step={step}
                />
            )}
            {helpText && <p className="text-xs text-gray-500">{helpText}</p>}
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}
