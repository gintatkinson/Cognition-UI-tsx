import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import Markdown from 'react-markdown';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { generateAIInsights } from '@/services/aiService';

interface AIInsightsCardProps {
  itemData: any;
  itemType: string;
}

export function AIInsightsCard({ itemData, itemType }: AIInsightsCardProps) {
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const dataStr = JSON.stringify(itemData, null, 2);
      const contextInfo = `Type: ${itemType}\nConfiguration:\n${dataStr}`;
      const result = await generateAIInsights(contextInfo);
      setInsights(result);
    } catch (err: any) {
      setError(err.message || 'Failed to generate insights.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-blue-500/5 border-blue-500/20 shadow-none mt-6">
      <CardHeader className="flex flex-row items-center justify-between border-b border-blue-500/10 pb-4">
        <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-500" />
          AI Analysis & Insights
        </CardTitle>
        {!insights && !loading && (
          <Button size="sm" variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20" onClick={fetchInsights}>
            Generate Insights
          </Button>
        )}
        {insights && !loading && (
          <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-blue-400" onClick={fetchInsights}>
            Regenerate
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-6">
        {loading && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
            <p className="text-sm">Analyzing {itemType} configuration and structure...</p>
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-500">Analysis Failed</p>
              <p className="text-sm text-red-400 mt-1">{error}</p>
            </div>
          </div>
        )}
        {insights && !loading && !error && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <Markdown>{insights}</Markdown>
          </div>
        )}
        {!insights && !loading && !error && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Click "Generate Insights" to perform an AI-driven analysis of this {itemType}.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
