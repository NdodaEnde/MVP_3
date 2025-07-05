import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { getDocument } from '@/api/documents';
import { useToast } from '@/hooks/useToast';
import { Document } from '@/api/documents';
import {
  X,
  Download,
  Eye,
  FileText,
  Image,
  Loader2,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink
} from 'lucide-react';

interface DocumentViewerProps {
  documentId: string;
  onClose: () => void;
}

export function DocumentViewer({ documentId, onClose }: DocumentViewerProps) {
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDocument();
  }, [documentId]);

  const fetchDocument = async () => {
    try {
      const response = await getDocument(documentId);
      setDocument((response as any).document);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load document",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Text copied to clipboard",
    });
  };

  const renderExtractedData = (data: any) => {
    if (!data) return null;

    return (
      <div className="space-y-4">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium capitalize text-sm">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(JSON.stringify(value, null, 2))}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              {typeof value === 'object' ? (
                <pre className="whitespace-pre-wrap text-xs">
                  {JSON.stringify(value, null, 2)}
                </pre>
              ) : (
                <span>{String(value)}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-4xl max-h-[90vh] bg-white">
          <CardContent className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-4xl max-h-[90vh] bg-white">
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-600">Document not found</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-7xl max-h-[95vh] bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            {document.type.includes('image') ? (
              <Image className="h-6 w-6 text-blue-600" />
            ) : (
              <FileText className="h-6 w-6 text-blue-600" />
            )}
            <div>
              <CardTitle className="text-lg">{document.name}</CardTitle>
              <CardDescription>
                Uploaded {new Date(document.uploadedAt).toLocaleDateString()} • 
                {(document.size / 1024 / 1024).toFixed(2)} MB
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={
              document.status === 'processed' ? 'default' :
              document.status === 'processing' ? 'secondary' :
              document.status === 'failed' ? 'destructive' : 'outline'
            }>
              {document.status === 'processed' && <CheckCircle className="h-3 w-3 mr-1" />}
              {document.status === 'processing' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              {document.status === 'failed' && <AlertCircle className="h-3 w-3 mr-1" />}
              {document.status}
            </Badge>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(90vh-200px)]">
            {/* Original Document */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Original Document
              </h3>
              <Card className="h-full bg-gray-50">
                <CardContent className="p-4 h-full">
                  {document.type.startsWith('image') ? (
                    <div className="h-full flex items-center justify-center">
                      <img
                        src={document.originalUrl}
                        alt={document.name}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                      />
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">PDF Preview</p>
                        <Button variant="outline">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open in New Tab
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Extracted Data */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Extracted Data
                {document.status === 'processed' && (
                  <Badge variant="default" className="ml-2">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    OCR Complete
                  </Badge>
                )}
              </h3>
              <Card className="h-full">
                <CardContent className="p-4 h-full">
                  <ScrollArea className="h-full">
                    {document.status === 'processed' && document.extractedData ? (
                      renderExtractedData(document.extractedData)
                    ) : document.status === 'processing' ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
                          <p className="text-gray-600">Processing document...</p>
                          <p className="text-sm text-gray-500 mt-2">
                            OCR extraction in progress
                          </p>
                        </div>
                      </div>
                    ) : document.status === 'failed' ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                          <p className="text-gray-600">Processing failed</p>
                          <Button variant="outline" className="mt-4">
                            Retry Processing
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">No extracted data available</p>
                          <Button variant="outline" className="mt-4">
                            Start Processing
                          </Button>
                        </div>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}