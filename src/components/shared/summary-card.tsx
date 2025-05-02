
import type { FC, ReactNode } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';

interface SummaryCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon?: ReactNode;
  imageUrl?: string; // Optional image URL
  imageHint?: string; // Optional hint for AI image generation
  isLoading?: boolean;
}

const SummaryCard: FC<SummaryCardProps> = ({
  title,
  value,
  description,
  icon,
  imageUrl,
  imageHint,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-5 w-2/5" />
          {imageUrl && <Skeleton className="h-10 w-10 rounded-sm" />}
          {!imageUrl && icon && <Skeleton className="h-6 w-6 rounded-sm text-muted-foreground" />}
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-1/3 mb-1" />
          <Skeleton className="h-4 w-4/5" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow overflow-hidden bg-card">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
             {title}
            </CardTitle>
        </div>
        {imageUrl && (
             <div className="w-12 h-12 flex items-center justify-center rounded-lg overflow-hidden bg-muted ml-4 shrink-0">
                 <Image
                    src={imageUrl}
                    alt={title}
                    width={48}
                    height={48}
                    className="object-cover"
                    data-ai-hint={imageHint}
                 />
             </div>
        )}
        {!imageUrl && icon && <div className="text-muted-foreground ml-4 shrink-0">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground">{value}</div>
        {description && (
             <p className="text-xs text-muted-foreground pt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default SummaryCard;
