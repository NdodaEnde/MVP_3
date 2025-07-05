import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DocumentUpload } from '@/components/DocumentUpload';
import { DocumentViewer } from '@/components/DocumentViewer';
import { getDocuments, deleteDocuments, processDocument } from '@/api/documents';
import { useToast } from '@/hooks/useToast';
import { Document } from '@/api/documents';
import {
  FileText,
  Search,
  Filter,
  Grid,
  List,
  Eye,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  MoreHorizontal,
  Image,
  File,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const documentTypeColors = {
  'medical-form': 'bg-blue-100 text-blue-800',
  'questionnaire': 'bg-green-100 text-green-800',
  'certificate': 'bg-purple-100 text-purple-800',
  'x-ray': 'bg-orange-100 text-orange-800',
  'lab-result': 'bg-yellow-100 text-yellow-800',
  'other': 'bg-gray-100 text-gray-800'
};

const statusColors = {
  'uploaded': 'bg-blue-100 text-blue-800',
  'processing': 'bg-yellow-100 text-yellow-800',
  'processed': 'bg-green-100 text-green-800',
  'failed': 'bg-red-100 text-red-800'
};

export function Documents() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDocuments();
  }, [typeFilter, statusFilter]);

  const fetchDocuments = async () => {
    try {
      const response = await getDocuments({
        type: typeFilter === 'all' ? undefined : typeFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchTerm || undefined
      });
      setDocuments((response as any).documents);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchDocuments();
  };

  const handleSelectDocument = (documentId: string, checked: boolean) => {
    if (checked) {
      setSelectedDocuments(prev => [...prev, documentId]);
    } else {
      setSelectedDocuments(prev => prev.filter(id => id !== documentId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDocuments(documents.map(doc => doc._id));
    } else {
      setSelectedDocuments([]);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedDocuments.length === 0) return;

    try {
      await deleteDocuments(selectedDocuments);
      toast({
        title: "Success",
        description: `${selectedDocuments.length} document(s) deleted successfully`,
      });
      setSelectedDocuments([]);
      fetchDocuments();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete documents",
        variant: "destructive",
      });
    }
  };

  const handleProcessDocument = async (documentId: string) => {
    try {
      await processDocument(documentId);
      toast({
        title: "Success",
        description: "Document processing started",
      });
      fetchDocuments();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process document",
        variant: "destructive",
      });
    }
  };

  const getDocumentIcon = (document: Document) => {
    if (document.type === 'x-ray' || document.name.toLowerCase().includes('image')) {
      return <Image className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-yellow-600 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-2"></div>
          <div className="h-4 bg-muted rounded w-96"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
            <p className="text-muted-foreground">
              Manage and process medical documents with OCR extraction
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowUpload(!showUpload)}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload Documents
        </Button>
      </div>

      {/* Upload Section */}
      {showUpload && (
        <DocumentUpload
          onUploadComplete={() => {
            fetchDocuments();
            setShowUpload(false);
          }}
        />
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap items-end">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="medical-form">Medical Forms</SelectItem>
                <SelectItem value="questionnaire">Questionnaires</SelectItem>
                <SelectItem value="certificate">Certificates</SelectItem>
                <SelectItem value="x-ray">X-Rays</SelectItem>
                <SelectItem value="lab-result">Lab Results</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="uploaded">Uploaded</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="processed">Processed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <div className="flex gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions Bar */}
      {selectedDocuments.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {selectedDocuments.length} document(s) selected
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Documents</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {selectedDocuments.length} document(s)? 
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteSelected}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents Display */}
      <Card>
        <CardHeader>
          <CardTitle>Documents ({filteredDocuments.length})</CardTitle>
          <CardDescription>
            All uploaded documents with OCR processing status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {viewMode === 'list' ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedDocuments.length === filteredDocuments.length && filteredDocuments.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((document) => (
                  <TableRow key={document._id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedDocuments.includes(document._id)}
                        onCheckedChange={(checked) => handleSelectDocument(document._id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {getDocumentIcon(document)}
                        <div>
                          <div className="font-medium">{document.name}</div>
                          {document.processedAt && (
                            <div className="text-sm text-muted-foreground">
                              Processed {new Date(document.processedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={documentTypeColors[document.type]}>
                        {document.type.replace('-', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(document.status)}
                        <Badge className={statusColors[document.status]}>
                          {document.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {(document.size / 1024 / 1024).toFixed(2)} MB
                    </TableCell>
                    <TableCell>
                      {new Date(document.uploadedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedDocument(document._id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setSelectedDocument(document._id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                            {document.status !== 'processed' && (
                              <DropdownMenuItem onClick={() => handleProcessDocument(document._id)}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Process
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredDocuments.map((document) => (
                <Card key={document._id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getDocumentIcon(document)}
                        <Badge className={documentTypeColors[document.type]} variant="secondary">
                          {document.type.replace('-', ' ')}
                        </Badge>
                      </div>
                      <Checkbox
                        checked={selectedDocuments.includes(document._id)}
                        onCheckedChange={(checked) => handleSelectDocument(document._id, checked as boolean)}
                      />
                    </div>
                    <h4 className="font-medium mb-2 truncate" title={document.name}>
                      {document.name}
                    </h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>Status:</span>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(document.status)}
                          <Badge className={statusColors[document.status]} variant="outline">
                            {document.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Size:</span>
                        <span>{(document.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Uploaded:</span>
                        <span>{new Date(document.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setSelectedDocument(document._id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          {document.status !== 'processed' && (
                            <DropdownMenuItem onClick={() => handleProcessDocument(document._id)}>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Process
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <DocumentViewer
          documentId={selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}
    </div>
  );
}