import { cn, fr } from '@/lib/utils';

export const Card = fr<'div'>((props, ref) => (
  <div
    {...props}
    ref={ref}
    className={cn('bg-white rounded-xl shadow p-6', props.className)}
  ></div>
));
