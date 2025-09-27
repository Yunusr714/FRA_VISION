import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  HelpCircle,
  Search,
  FileText,
  Video,
  MessageCircle,
  Phone,
  Mail,
  Download,
  BookOpen,
  Volume2,
  Globe
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';

const Help = () => {
  const { t, i18n } = useTranslation();
  const { eli5Mode } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');

  // FAQ data
  const faqData = [
    {
      question: 'What is the Forest Rights Act (FRA)?',
      answer: 'The Forest Rights Act, 2006 recognizes and vests forest rights and occupation in forest land in forest-dwelling scheduled tribes and other traditional forest dwellers.',
      category: 'general',
    },
    {
      question: 'Who can apply for forest rights?',
      answer: 'Scheduled Tribes and other traditional forest dwellers who have been residing in forest areas for generations can apply.',
      category: 'eligibility',
    },
    {
      question: 'What documents are required for claim submission?',
      answer: 'Required documents include: Identity proof (Aadhaar/Voter ID), Residence proof, Community/Tribal certificate, and evidence of traditional land use.',
      category: 'documents',
    },
    {
      question: 'How long does the claim processing take?',
      answer: 'The standard processing time is 15-30 days, depending on the complexity of the claim and availability of documents.',
      category: 'process',
    },
    {
      question: 'What is a Forever Passbook?',
      answer: 'The Forever Passbook is a blockchain-secured digital certificate that provides immutable proof of your land rights.',
      category: 'passbook',
    },
    {
      question: 'How does the AI analysis work?',
      answer: 'Our AI system analyzes your submitted documents and land coordinates to predict approval probability and identify potential issues for officers.',
      category: 'technology',
    },
    {
      question: 'What if my claim is rejected?',
      answer: 'If your claim is rejected, you will receive detailed reasons. You can appeal the decision within 60 days.',
      category: 'process',
    },
    {
      question: 'How can NGOs help with claims?',
      answer: 'Registered NGOs can assist tribal communities in submitting claims, provide documentation support, and help track the application status.',
      category: 'support',
    },
  ];

  // Video tutorials
  const videoTutorials = [
    {
      title: 'How to Submit Your First FRA Claim',
      duration: '8:45',
      language: 'English/Hindi',
      thumbnail: '/placeholder-video.jpg',
    },
    {
      title: 'Understanding Your Rights Under FRA',
      duration: '12:30',
      language: 'English/Hindi',
      thumbnail: '/placeholder-video.jpg',
    },
    {
      title: 'Using the 3D Atlas to Find Your Land',
      duration: '5:15',
      language: 'English/Hindi',
      thumbnail: '/placeholder-video.jpg',
    },
  ];

  // Helpful resources
  const resources = [
    {
      title: 'Forest Rights Act Complete Text',
      description: 'Official government document with full act details.',
      type: 'PDF',
      size: '2.4 MB',
      language: 'English/Hindi',
    },
    {
      title: 'FRA Rules and Procedures',
      description: 'Detailed procedures for claim submission and processing.',
      type: 'PDF',
      size: '1.8 MB',
      language: 'English/Hindi',
    },
    {
      title: 'Community Forest Rights Guide',
      description: 'Special guide for community-level rights claims.',
      type: 'PDF',
      size: '3.1 MB',
      language: 'English/Hindi',
    },
    {
      title: 'Sample Documents Template',
      description: 'Templates and examples of required documents.',
      type: 'ZIP',
      size: '5.2 MB',
      language: 'Multiple',
    },
  ];

  const filteredFAQs = searchQuery
    ? faqData.filter(faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqData;

  const playTextToSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = i18n.language === 'hi' ? 'hi-IN' : 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <HelpCircle className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">Help & Support</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Everything you need to know about forest rights, claim submission, and using the FRA Atlas platform.
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for help topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Help Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="text-center">
            <FileText className="h-12 w-12 text-primary mx-auto mb-2" />
            <CardTitle>Submit a Claim</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Step-by-step guide to submit your forest rights claim.
            </p>
            <Button className="w-full">Get Started</Button>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="text-center">
            <HelpCircle className="h-12 w-12 text-primary mx-auto mb-2" />
            <CardTitle>Track Your Claim</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Check the latest status of your submitted claim.
            </p>
            <Button variant="outline" className="w-full">Track Now</Button>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="text-center">
            <MessageCircle className="h-12 w-12 text-primary mx-auto mb-2" />
            <CardTitle>Get Support</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Contact our support team for personalized assistance.
            </p>
            <Button variant="outline" className="w-full">Contact Us</Button>
          </CardContent>
        </Card>
      </div>
      
      {/* ELI5 Mode Toggle Info */}
      {eli5Mode && (
        <Alert className="eli5-mode">
          <HelpCircle className="h-4 w-4" />
          <AlertDescription>
            ELI5 mode is ON! This means all explanations will be in simple language that anyone can understand.
          </AlertDescription>
        </Alert>
      )}

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>Common questions about forest rights and using our platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {filteredFAQs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  <div className="flex items-center justify-between w-full">
                    <span>{faq.question}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        playTextToSpeech(faq.question + ' ' + faq.answer);
                      }}
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pt-2">
                    <p className="text-muted-foreground">{faq.answer}</p>
                    {eli5Mode && faq.category === 'technology' && (
                      <Alert className="mt-3 eli5-mode">
                        <HelpCircle className="h-4 w-4" />
                        <AlertDescription>
                          In simple terms: Our computer looks at your papers and tells human officers if everything looks good. The computer helps, but people make the final decisions.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Video Tutorials */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Video className="h-5 w-5" />
            <span>Video Tutorials</span>
          </CardTitle>
          <CardDescription>Watch step-by-step video guides in your preferred language.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {videoTutorials.map((video, index) => (
              <Card key={index} className="border hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="aspect-video bg-muted rounded-lg mb-3 flex items-center justify-center">
                    <Video className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h4 className="font-medium mb-2">{video.title}</h4>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{video.duration}</span>
                    <div className="flex items-center space-x-1">
                      <Globe className="h-3 w-3" />
                      <span>{video.language}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Downloadable Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5" />
            <span>Downloadable Resources</span>
          </CardTitle>
          <CardDescription>Official documents, guides, and templates.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {resources.map((resource, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-6 w-6 text-primary" />
                  <div>
                    <h4 className="font-medium">{resource.title}</h4>
                    <p className="text-sm text-muted-foreground">{resource.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                      <span>{resource.type}</span>
                      <span>{resource.size}</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="mr-1 h-3 w-3" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="text-center">
            <Phone className="h-8 w-8 text-primary mx-auto mb-2" />
            <CardTitle>Phone Support</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-2">Toll-free helpline</p>
            <p className="font-medium">1800-XXX-XXXX</p>
            <p className="text-sm text-muted-foreground">Mon-Fri, 9 AM - 6 PM</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="text-center">
            <Mail className="h-8 w-8 text-primary mx-auto mb-2" />
            <CardTitle>Email Support</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-2">Email us your queries</p>
            <p className="font-medium">support@fra.gov.in</p>
            <p className="text-sm text-muted-foreground">Response within 24 hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="text-center">
            <MessageCircle className="h-8 w-8 text-primary mx-auto mb-2" />
            <CardTitle>Live Chat</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-2">Chat with our AI assistant</p>
            <Button className="w-full">Start Chat</Button>
            <p className="text-sm text-muted-foreground mt-2">Available 24/7</p>
          </CardContent>
        </Card>
      </div>

      {/* Language Support */}
      <Card>
        <CardHeader>
          <CardTitle>Language Support</CardTitle>
          <CardDescription>Our platform supports multiple languages for better accessibility.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Supported Languages</h4>
              <div className="space-y-1 text-sm">
                <div>English</div>
                <div>हिंदी (Hindi)</div>
                <div>বাংলা (Bengali)</div>
                <div>मराठी (Marathi)</div>
                <div>தமிழ் (Tamil)</div>
                <div>తెలుగు (Telugu)</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Voice Support</h4>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full">
                  <Volume2 className="mr-2 h-4 w-4" />
                  Enable Text-to-Speech
                </Button>
                <p className="text-xs text-muted-foreground">
                  Listen to any text on the platform in your preferred language.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default Help;