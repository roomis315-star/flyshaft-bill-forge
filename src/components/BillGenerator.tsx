import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Plus, Printer, Download } from 'lucide-react';
import flyshaftLogo from '@/assets/flyshaft-logo.png';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface LineItem {
  id: string;
  productName: string;
  hsn?: string;
  sac?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  sgstRate: number;
  cgstRate: number;
  igstRate: number;
}

interface CustomerInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  gstNumber?: string;
}

interface InvoiceDetails {
  invoiceNumber: string;
  date: string;
  dueDate: string;
}

// const [shippingInfo, setShippingInfo] = useState<CustomerInfo>({
//   name: '',
//   address: '',
//   phone: '',
//   email: ''
// });
// const [sameAsBilling, setSameAsBilling] = useState<boolean>(true);

// useEffect(() => {
//   if (sameAsBilling) {
//     setShippingInfo(customerInfo);
//   }
//   // eslint-disable-next-line react-hooks/exhaustive-deps
// }, [customerInfo, sameAsBilling]);

const BillGenerator = () => {
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', productName: '', hsn: '', sac: '', quantity: 1, unitPrice: 0, discount: 0, sgstRate: 9, cgstRate: 9, igstRate: 18 }
  ]);
  const [deliveryCharge, setDeliveryCharge] = useState<number>(0);
  const [isInterState, setIsInterState] = useState<boolean>(false);
  const [customerType, setCustomerType] = useState<'b2b' | 'd2c'>('b2b');
  const [itemType, setItemType] = useState<'hsn' | 'sac'>('hsn'); // New state for HSN/SAC selection
  
  // Derive isB2B from customerType for backward compatibility
  const isB2B = customerType === 'b2b';
  
  // State for export functionality
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');


  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    address: '',
    phone: '',
    email: ''
  });

  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetails>({
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: ''
  });

  const [shippingInfo, setShippingInfo] = useState<CustomerInfo>({
    name: '',
    address: '',
    phone: '',
    email: ''
  });
  const [sameAsBilling, setSameAsBilling] = useState<boolean>(true);

  useEffect(() => {
    if (sameAsBilling) {
      setShippingInfo(customerInfo);
    } else {
      // Clear shipping info when unchecked
      setShippingInfo({
        name: '',
        address: '',
        phone: '',
        email: ''
      });
    }
  }, [customerInfo, sameAsBilling]);

  // Amount in words conversion
  const convertToWords = (amount: number): string => {
    if (isNaN(amount)) return "";
    const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const units = (n: number) => {
      if (n < 20) return a[n];
      const t = Math.floor(n / 10), r = n % 10;
      return b[t] + (r ? " " + a[r] : "");
    };
    const toWords = (n: number): string => {
      if (n === 0) return "Zero";
      let str = "";
      let num = n;
      const crore = Math.floor(num / 10000000); num %= 10000000;
      const lakh = Math.floor(num / 100000); num %= 100000;
      const thousand = Math.floor(num / 1000); num %= 1000;
      const hundred = Math.floor(num / 100); num %= 100;
      if (crore) str += toWords(crore) + " Crore ";
      if (lakh) str += toWords(lakh) + " Lakh ";
      if (thousand) str += toWords(thousand) + " Thousand ";
      if (hundred) str += a[hundred] + " Hundred ";
      if (num) str += (str ? "and " : "") + units(num) + " ";
      return str.trim();
    };
    const whole = Math.floor(amount);
    const paise = Math.round((amount - whole) * 100);
    let words = toWords(whole) + " Rupees";
    if (paise) words += " and " + toWords(paise) + " Paise";
    return words + " Only";
  };

  const addLineItem = () => {
    const newId = Date.now().toString();
    setLineItems([
      ...lineItems,
      {
        id: newId,
        productName: '',
        hsn: '',
        sac: '',
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        sgstRate: 9,
        cgstRate: 9,
        igstRate: 18,
      },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id));
    }
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(lineItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const calculateLineTotal = (item: LineItem) => {
    const subtotal = item.quantity * item.unitPrice;
    const discountAmount = (subtotal * item.discount) / 100;
    const afterDiscount = subtotal - discountAmount;
    
    if (isInterState) {
      // Inter-state: only IGST
      const igstAmount = (afterDiscount * item.igstRate) / 100;
      return afterDiscount + igstAmount;
    } else {
      // Within state: CGST + SGST
      const sgstAmount = (afterDiscount * item.sgstRate) / 100;
      const cgstAmount = (afterDiscount * item.cgstRate) / 100;
      return afterDiscount + sgstAmount + cgstAmount;
    }
  };

  const calculateTotalGST = () => {
    return lineItems.reduce((sum, item) => {
      const subtotal = item.quantity * item.unitPrice;
      const discountAmount = (subtotal * item.discount) / 100;
      const afterDiscount = subtotal - discountAmount;
      
      if (isInterState) {
        // Inter-state: only IGST
        const igstAmount = (afterDiscount * item.igstRate) / 100;
        return sum + igstAmount;
      } else {
        // Within state: CGST + SGST
        const sgstAmount = (afterDiscount * item.sgstRate) / 100;
        const cgstAmount = (afterDiscount * item.cgstRate) / 100;
        return sum + sgstAmount + cgstAmount;
      }
    }, 0);
  };
  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  };
  const calculateTotalItemDiscount = () => {
    return lineItems.reduce((sum, item) => {
      const subtotal = item.quantity * item.unitPrice;
      return sum + (subtotal * item.discount) / 100;
    }, 0);
  };


  const calculateFinalTotal = () => {
    const subtotal = calculateSubtotal();
    const itemDiscounts = calculateTotalItemDiscount();
    const gstAmount = calculateTotalGST();
    return subtotal - itemDiscounts + gstAmount + deliveryCharge;
  };

  // Handle print functionality
  const handlePrint = () => {
    // Inject minimal print styles and isolate invoice
    const styleEl = document.createElement('style');
    styleEl.id = 'print-style';
    styleEl.textContent = `
      @media print {
        body * { visibility: hidden; }
        .invoice-content, .invoice-content * { visibility: visible; }
        .invoice-content {
          position: absolute;
          left: 0; top: 0;
          width: 100%;
        }
        .print\\:hidden { display: none !important; }
        .hidden.print\\:block { display: block !important; }
        /* Ensure bill to and ship to appear side by side */
        .grid.md\\:grid-cols-2 { 
          display: grid !important; 
          grid-template-columns: 1fr 1fr !important; 
          gap: 2rem !important; 
        }
        .md\\:text-right { text-align: right !important; }
        /* Force column layout for bill/shipping info */
        div[class*='grid'] div[class*='gap-8'] { 
          display: grid !important; 
          grid-template-columns: 1fr 1fr !important; 
          gap: 2rem !important; 
        }
        /* Specific selector for the bill/shipping container */
        .bill-shipping-container { 
          display: grid !important; 
          grid-template-columns: 1fr 1fr !important; 
          gap: 2rem !important; 
        }
      }
      @page {
        margin: 12mm 10mm;
      }
    `;
    document.head.appendChild(styleEl);

    const originalTitle = document.title;
    document.title = invoiceDetails.invoiceNumber
      ? `Invoice ${invoiceDetails.invoiceNumber}`
      : 'Invoice';

    window.print();

    // Clean up styles after printing
    setTimeout(() => {
      document.title = originalTitle;
      styleEl.remove();
    }, 500);
  };
  
  // Prepare invoice data for export
  const prepareInvoiceDataForExport = () => {
    return {
      invoiceNumber: invoiceDetails.invoiceNumber,
      date: invoiceDetails.date,
      dueDate: invoiceDetails.dueDate,
      customerName: customerInfo.name,
      customerAddress: customerInfo.address,
      customerPhone: customerInfo.phone,
      customerEmail: customerInfo.email,
      customerGst: customerInfo.gstNumber,
      shippingName: shippingInfo.name,
      shippingAddress: shippingInfo.address,
      shippingPhone: shippingInfo.phone,
      shippingEmail: shippingInfo.email,
      subtotal: calculateSubtotal(),
      totalDiscount: calculateTotalItemDiscount(),
      totalGst: calculateTotalGST(),
      deliveryCharge: deliveryCharge,
      finalTotal: calculateFinalTotal(),
      customerType: customerType,
      transactionType: isInterState ? 'inter-state' : 'within-state',
      lineItems: lineItems.map(item => ({
        productName: item.productName,
        hsn: item.hsn || '',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        sgstRate: item.sgstRate,
        cgstRate: item.cgstRate,
        igstRate: item.igstRate,
        total: calculateLineTotal(item)
      }))
    };
  };
  
  // Handle export to Google Sheet
  const handleExportToGoogleSheet = async () => {
    if (!invoiceDetails.invoiceNumber) {
      setExportMessage('Please enter an invoice number first');
      return;
    }
  
    setIsExporting(true);
    setExportMessage('Exporting to Google Sheet...');
      
    try {
      const invoiceData = prepareInvoiceDataForExport();
      const result = await sendInvoiceToGoogleSheet(invoiceData);
        
      setExportMessage(result.message);
        
      if (result.success) {
        // Clear message after 3 seconds
        setTimeout(() => setExportMessage(''), 3000);
      }
    } catch (error) {
      setExportMessage('Export failed. Please try again.');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };
  
  // Handle CSV download (alternative export method)
  const handleDownloadCSV = () => {
    if (!invoiceDetails.invoiceNumber) {
      setExportMessage('Please enter an invoice number first');
      return;
    }
      
    const invoiceData = prepareInvoiceDataForExport();
    const result = downloadInvoiceAsCSV(invoiceData);
    setExportMessage(result.message);
      
    // Clear message after 3 seconds
    setTimeout(() => setExportMessage(''), 3000);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Bill Generator</h1>
          <Button onClick={handlePrint} className="print:hidden">
            <Printer className="w-4 h-4 mr-2" />
            Print Bill
          </Button>
        </div>
        
        {/* Export message */}
        {exportMessage && (
          <div className="mb-4 p-3 rounded-md bg-blue-50 border border-blue-200 text-blue-800 print:hidden">
            {exportMessage}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Side - Input Form */}
          <div className="lg:col-span-1 space-y-6 print:hidden">
            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <img src={flyshaftLogo} alt="Flyshaft Logo" className="w-34 h-24 mx-auto mb-2" />
                  <h2 className="text-xl font-semibold">Flyshaft</h2>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Details */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="invoiceNumber">Invoice Number</Label>
                  <Input
                    id="invoiceNumber"
                    value={invoiceDetails.invoiceNumber}
                    onChange={(e) => setInvoiceDetails({ ...invoiceDetails, invoiceNumber: e.target.value })}
                    placeholder="INV-001"
                  />
                </div>
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={invoiceDetails.date}
                    onChange={(e) => setInvoiceDetails({ ...invoiceDetails, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={invoiceDetails.dueDate}
                    onChange={(e) => setInvoiceDetails({ ...invoiceDetails, dueDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="block mb-2">Transaction Type</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="sameState"
                        name="transactionType"
                        checked={!isInterState}
                        onChange={() => setIsInterState(false)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <Label htmlFor="sameState" className="cursor-pointer">Within State (CGST + SGST)</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="interState"
                        name="transactionType"
                        checked={isInterState}
                        onChange={() => setIsInterState(true)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <Label htmlFor="interState" className="cursor-pointer">Inter-State (IGST)</Label>
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="block mb-2">Customer Type</Label>
                  <RadioGroup 
                    value={customerType} 
                    onValueChange={(value: 'b2b' | 'd2c') => {
                      setCustomerType(value);
                    }}
                    className="flex flex-col space-y-0"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="b2b" id="customer-type-b2b" />
                      <Label htmlFor="customer-type-b2b" className="cursor-pointer">B2B (Business to Business)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="d2c" id="customer-type-d2c" />
                      <Label htmlFor="customer-type-d2c" className="cursor-pointer">D2C (Direct to Consumer)</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div>
                  <Label className="block mb-2">Item Type</Label>
                  <RadioGroup 
                    value={itemType} 
                    onValueChange={(value: 'hsn' | 'sac') => {
                      setItemType(value);
                    }}
                    className="flex flex-col space-y-0"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="hsn" id="item-type-hsn" />
                      <Label htmlFor="item-type-hsn" className="cursor-pointer">HSN (Goods)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sac" id="item-type-sac" />
                      <Label htmlFor="item-type-sac" className="cursor-pointer">SAC (Services)</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>

            {/* Customer Info (Bill To) */}
            <Card>
              <CardHeader>
                <CardTitle>Bill To</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="customerAddress">Address</Label>
                  <Textarea
                    id="customerAddress"
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                    placeholder="123 Main St, City, State, ZIP"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">Phone</Label>
                  <Input
                    id="customerPhone"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="customerGst">GST IN (B2B)</Label>
                  <Input
                    id="customerGst"
                    value={customerInfo.gstNumber || ''}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, gstNumber: e.target.value })}
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Shipping Info (Ship To) */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Ship To</CardTitle>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="sameAsBilling"
                      checked={sameAsBilling}
                      onCheckedChange={(checked) => setSameAsBilling(Boolean(checked))}
                    />
                    <Label htmlFor="sameAsBilling" className="cursor-pointer">Same as Bill To</Label>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="shipName">Recipient Name</Label>
                  <Input
                    id="shipName"
                    value={shippingInfo.name}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, name: e.target.value })}
                    placeholder="Recipient"
                    disabled={sameAsBilling}
                  />
                </div>
                <div>
                  <Label htmlFor="shipAddress">Address</Label>
                  <Textarea
                    id="shipAddress"
                    value={shippingInfo.address}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                    placeholder="Delivery address"
                    rows={3}
                    disabled={sameAsBilling}
                  />
                </div>
                <div>
                  <Label htmlFor="shipPhone">Phone</Label>
                  <Input
                    id="shipPhone"
                    value={shippingInfo.phone}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                    placeholder="+1 (555) 987-6543"
                    disabled={sameAsBilling}
                  />
                </div>
                <div>
                  <Label htmlFor="shipEmail">Email</Label>
                  <Input
                    id="shipEmail"
                    type="email"
                    value={shippingInfo.email}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, email: e.target.value })}
                    placeholder="recipient@example.com"
                    disabled={sameAsBilling}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Bill Preview */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardContent className="p-8 invoice-content">
                {/* Header: left logo + company info (small), right invoice details */}
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <img src={flyshaftLogo} alt="Flyshaft Logo" className="w-26 h-16" />
                    <div className="mt-2 text-xs text-invoice-text space-y-1">
                      <p className="font-medium">Flyshaft Technologies</p>
                      <p>Sarawagi, Tikait Nagar, Siraul Gauspur</p>
                      <p>Barabanki-225415</p>
                      <p>Uttar Pradesh UP</p>
                      <p>India</p>
                      <p>Phone: +91 8858927811</p>
                      <p>GSTIN: 09AAGCF7695F1Z4</p>
                      <p>CIN: U58200UP2025PTC239013</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h2 className="text-2xl font-bold text-invoice-header">INVOICE</h2>
                    {invoiceDetails.invoiceNumber && (
                      <p className="text-invoice-text mt-1">#{invoiceDetails.invoiceNumber}</p>
                    )}
                    <div className="mt-3 text-sm text-invoice-text space-y-1">
                      {invoiceDetails.date && (
                        <p><span className="font-medium">Date: </span>{new Date(invoiceDetails.date).toLocaleDateString()}</p>
                      )}
                      {invoiceDetails.dueDate && (
                        <p><span className="font-medium">Due Date: </span>{new Date(invoiceDetails.dueDate).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bill To + Ship To row */}
                <div className="grid md:grid-cols-2 gap-8 mb-8 bill-shipping-container">
                  <div>
                    <h3 className="font-semibold text-invoice-header mb-3">Bill To</h3>
                    <div className="text-invoice-text space-y-1">
                      {customerInfo.name && <p className="font-medium">{customerInfo.name}</p>}
                      {customerInfo.address && <p className="whitespace-pre-line">{customerInfo.address}</p>}
                      {customerInfo.phone && <p>{customerInfo.phone}</p>}
                      {customerInfo.email && <p>{customerInfo.email}</p>}
                      {customerInfo.gstNumber && <p><span className="font-medium">GST IN:</span> {customerInfo.gstNumber}</p>}
                    </div>
                  </div>
                  {itemType === 'hsn' && (
                    <div className="md:text-right">
                      <h3 className="font-semibold text-invoice-header mb-3">Ship To</h3>
                      <div className="text-invoice-text space-y-1">
                        {shippingInfo.name && <p className="font-medium">{shippingInfo.name}</p>}
                        {shippingInfo.address && <p className="whitespace-pre-line">{shippingInfo.address}</p>}
                        {shippingInfo.phone && <p>{shippingInfo.phone}</p>}
                        {shippingInfo.email && <p>{shippingInfo.email}</p>}
                      </div>
                    </div>
                  )}
                </div>

                {/* Line Items Table */}
                <div className="mb-8">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-border">
                          {itemType === 'hsn' && <th className="text-left py-3 px-2 font-semibold text-invoice-header">Goods</th>}
                          {itemType === 'sac' && <th className="text-left py-3 px-2 font-semibold text-invoice-header">Services</th>}
                          {itemType === 'hsn' && <th className="text-left py-3 px-2 font-semibold text-invoice-header">HSN</th>}
                          {itemType === 'sac' && <th className="text-left py-3 px-2 font-semibold text-invoice-header">SAC</th>}
                          {itemType === 'hsn' && <th className="text-center py-3 px-2 font-semibold text-invoice-header">Qty</th>}
                          <th className="text-right py-3 px-2 font-semibold text-invoice-header">Rate (₹)</th>
                          <th className="text-right py-3 px-2 font-semibold text-invoice-header">Discount %</th>
                          {!isInterState && <th className="text-right py-3 px-2 font-semibold text-invoice-header">SGST %</th>}
                          {!isInterState && <th className="text-right py-3 px-2 font-semibold text-invoice-header">CGST %</th>}
                          {isInterState && <th className="text-right py-3 px-2 font-semibold text-invoice-header">IGST %</th>}
                          <th className="text-right py-3 px-2 font-semibold text-invoice-header">Total (₹)</th>
                          <th className="w-12 print:hidden"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {lineItems.map((item) => (
                          <tr key={item.id} className="border-b border-border">
                            <td className="py-3 px-2">
                              <Input
                                value={item.productName}
                                onChange={(e) => updateLineItem(item.id, 'productName', e.target.value)}
                                placeholder="Product / Service"
                                className="border-0 bg-transparent p-0 focus-visible:ring-0 print:hidden"
                              />
                              <span className="hidden print:block text-invoice-text">{item.productName}</span>
                            </td>
                            <td className="py-3 px-2">
                              {itemType === 'hsn' && (
                                <Input
                                  value={item.hsn}
                                  onChange={(e) => updateLineItem(item.id, 'hsn', e.target.value)}
                                  placeholder="HSN"
                                  className="border-0 bg-transparent p-0 focus-visible:ring-0 print:hidden"
                                />
                              )}
                              {itemType === 'sac' && (
                                <Input
                                  value={item.sac}
                                  onChange={(e) => updateLineItem(item.id, 'sac', e.target.value)}
                                  placeholder="SAC"
                                  className="border-0 bg-transparent p-0 focus-visible:ring-0 print:hidden"
                                />
                              )}
                              <span className="hidden print:block text-invoice-text">
                                {itemType === 'hsn' ? item.hsn : item.sac}
                              </span>
                            </td>
                            {itemType === 'hsn' && (
                              <td className="py-3 px-2 text-center">
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateLineItem(item.id, 'quantity', Number(e.target.value))}
                                  className="border-0 bg-transparent p-0 text-center focus-visible:ring-0 print:hidden"
                                  min="1"
                                />
                                <span className="hidden print:block text-invoice-text">{parseInt(item.quantity.toString())}</span>
                              </td>
                            )}
                            <td className="py-3 px-2 text-right">
                              <Input
                                type="number"
                                value={item.unitPrice}
                                onChange={(e) => updateLineItem(item.id, 'unitPrice', Number(e.target.value))}
                                className="border-0 bg-transparent p-0 text-right focus-visible:ring-0 print:hidden"
                                min="0"
                                step="0.01"
                              />
                              <span className="hidden print:block text-invoice-text">
                                {item.unitPrice > 0 ? `₹ ${item.unitPrice.toFixed(2)}` : ''}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-right">
                              <Input
                                type="number"
                                value={item.discount}
                                onChange={(e) => updateLineItem(item.id, 'discount', Number(e.target.value))}
                                className="border-0 bg-transparent p-0 text-right focus-visible:ring-0 print:hidden"
                                min="0"
                                max="100"
                              />
                              <span className="hidden print:block text-invoice-text">
                                {item.discount > 0 ? `${item.discount}%` : ''}
                              </span>
                            </td>
                            {!isInterState && (
                              <td className="py-3 px-2 text-right">
                                <Input
                                  type="number"
                                  value={item.sgstRate}
                                  onChange={(e) => updateLineItem(item.id, 'sgstRate', Number(e.target.value))}
                                  className="border-0 bg-transparent p-0 text-right focus-visible:ring-0 print:hidden"
                                  min="0"
                                  max="100"
                                />
                                <span className="hidden print:block text-invoice-text">
                                  {item.sgstRate > 0 ? `${item.sgstRate}%` : ''}
                                </span>
                              </td>
                            )}
                            {!isInterState && (
                              <td className="py-3 px-2 text-right">
                                <Input
                                  type="number"
                                  value={item.cgstRate}
                                  onChange={(e) => updateLineItem(item.id, 'cgstRate', Number(e.target.value))}
                                  className="border-0 bg-transparent p-0 text-right focus-visible:ring-0 print:hidden"
                                  min="0"
                                  max="100"
                                />
                                <span className="hidden print:block text-invoice-text">
                                  {item.cgstRate > 0 ? `${item.cgstRate}%` : ''}
                                </span>
                              </td>
                            )}
                            {isInterState && (
                              <td className="py-3 px-2 text-right">
                                <Input
                                  type="number"
                                  value={item.igstRate}
                                  onChange={(e) => updateLineItem(item.id, 'igstRate', Number(e.target.value))}
                                  className="border-0 bg-transparent p-0 text-right focus-visible:ring-0 print:hidden"
                                  min="0"
                                  max="100"
                                />
                                <span className="hidden print:block text-invoice-text">
                                  {item.igstRate > 0 ? `${item.igstRate}%` : ''}
                                </span>
                              </td>
                            )}
                            <td className="py-3 px-2 text-right font-medium text-invoice-text">
                              ₹ {calculateLineTotal(item).toFixed(2)}
                            </td>
                            <td className="py-3 px-2 print:hidden">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeLineItem(item.id)}
                                className="text-destructive hover:text-destructive"
                                disabled={lineItems.length === 1}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <Button
                    onClick={addLineItem}
                    variant="outline"
                    className="mt-4 print:hidden"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Line Item
                  </Button>
                </div>

                {/* B2B Tax Breakdown Table */}
                {isB2B && (
                  <div className="mb-8">
                    <h3 className="font-semibold text-invoice-header mb-3">Tax Breakdown</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border border-border">
                        <thead>
                          <tr className="bg-muted">
                            <th className="text-left py-2 px-3 font-semibold text-invoice-header border-r border-border">Description</th>
                            <th className="text-right py-2 px-3 font-semibold text-invoice-header border-r border-border">Taxable Value (₹)</th>
                            {!isInterState && <th className="text-right py-2 px-3 font-semibold text-invoice-header border-r border-border">CGST Rate (%)</th>}
                            {!isInterState && <th className="text-right py-2 px-3 font-semibold text-invoice-header border-r border-border">CGST Amount (₹)</th>}
                            {!isInterState && <th className="text-right py-2 px-3 font-semibold text-invoice-header border-r border-border">SGST Rate (%)</th>}
                            {!isInterState && <th className="text-right py-2 px-3 font-semibold text-invoice-header border-r border-border">SGST Amount (₹)</th>}
                            {isInterState && <th className="text-right py-2 px-3 font-semibold text-invoice-header border-r border-border">IGST Rate (%)</th>}
                            {isInterState && <th className="text-right py-2 px-3 font-semibold text-invoice-header border-r border-border">IGST Amount (₹)</th>}
                            <th className="text-right py-2 px-3 font-semibold text-invoice-header">Total Tax (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lineItems.map((item) => {
                            const subtotal = item.quantity * item.unitPrice;
                            const discountAmount = (subtotal * item.discount) / 100;
                            const taxableValue = subtotal - discountAmount;
                            
                            let cgstAmount = 0;
                            let sgstAmount = 0;
                            let igstAmount = 0;
                            let totalTax = 0;
                            
                            if (isInterState) {
                              igstAmount = (taxableValue * item.igstRate) / 100;
                              totalTax = igstAmount;
                            } else {
                              cgstAmount = (taxableValue * item.cgstRate) / 100;
                              sgstAmount = (taxableValue * item.sgstRate) / 100;
                              totalTax = cgstAmount + sgstAmount;
                            }
                            
                            return (
                              <tr key={`tax-${item.id}`} className="border-b border-border">
                                <td className="py-2 px-3 text-invoice-text border-r border-border">
                                  {item.productName || 'Item'}
                                </td>
                                <td className="py-2 px-3 text-right text-invoice-text border-r border-border">
                                  {taxableValue.toFixed(2)}
                                </td>
                                {!isInterState && (
                                  <>
                                    <td className="py-2 px-3 text-right text-invoice-text border-r border-border">
                                      {item.cgstRate}%
                                    </td>
                                    <td className="py-2 px-3 text-right text-invoice-text border-r border-border">
                                      {cgstAmount.toFixed(2)}
                                    </td>
                                    <td className="py-2 px-3 text-right text-invoice-text border-r border-border">
                                      {item.sgstRate}%
                                    </td>
                                    <td className="py-2 px-3 text-right text-invoice-text border-r border-border">
                                      {sgstAmount.toFixed(2)}
                                    </td>
                                  </>
                                )}
                                {isInterState && (
                                  <>
                                    <td className="py-2 px-3 text-right text-invoice-text border-r border-border">
                                      {item.igstRate}%
                                    </td>
                                    <td className="py-2 px-3 text-right text-invoice-text border-r border-border">
                                      {igstAmount.toFixed(2)}
                                    </td>
                                  </>
                                )}
                                <td className="py-2 px-3 text-right font-medium text-invoice-text">
                                  {totalTax.toFixed(2)}
                                </td>
                              </tr>
                            );
                          })}
                          {/* Summary Row */}
                          <tr className="bg-muted font-semibold">
                            <td className="py-2 px-3 text-invoice-header border-r border-border">Total</td>
                            <td className="py-2 px-3 text-right text-invoice-header border-r border-border">
                              ₹ {calculateSubtotal().toFixed(2)}
                            </td>
                            {!isInterState && (
                              <>
                                <td className="py-2 px-3 text-right text-invoice-header border-r border-border"></td>
                                <td className="py-2 px-3 text-right text-invoice-header border-r border-border">
                                  ₹ {(calculateTotalGST() / 2).toFixed(2)}
                                </td>
                                <td className="py-2 px-3 text-right text-invoice-header border-r border-border"></td>
                                <td className="py-2 px-3 text-right text-invoice-header border-r border-border">
                                  ₹ {(calculateTotalGST() / 2).toFixed(2)}
                                </td>
                              </>
                            )}
                            {isInterState && (
                              <>
                                <td className="py-2 px-3 text-right text-invoice-header border-r border-border"></td>
                                <td className="py-2 px-3 text-right text-invoice-header border-r border-border">
                                  ₹ {calculateTotalGST().toFixed(2)}
                                </td>
                              </>
                            )}
                            <td className="py-2 px-3 text-right text-invoice-header">
                              ₹ {calculateTotalGST().toFixed(2)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div className="flex justify-end">
                  <div className="w-80 space-y-2">
                    <div className="flex justify-between py-2 text-invoice-text">
                      <span>Subtotal:</span>
                      <span>₹ {calculateSubtotal().toFixed(2)}</span>
                    </div>
                    {calculateTotalItemDiscount() > 0 && (
                      <div className="flex justify-between py-2 text-invoice-text">
                        <span>Item Discounts:</span>
                        <span>-₹ {calculateTotalItemDiscount().toFixed(2)}</span>
                      </div>
                    )}
                    {calculateTotalGST() > 0 && isB2B && (
                      <div className="flex justify-between py-2 text-invoice-text">
                        <span>Total GST:</span>
                        <span>₹ {calculateTotalGST().toFixed(2)}</span>
                      </div>
                    )}
                    {calculateTotalGST() > 0 && !isB2B && (
                      <div className="flex justify-between py-2 text-invoice-text">
                        <span>Tax:</span>
                        <span>₹ {calculateTotalGST().toFixed(2)}</span>
                      </div>
                    )}
                    {itemType === 'hsn' && (
                      <div className="flex justify-between py-2 text-invoice-text">
                        <span>Delivery Charge:</span>
                        <div className="flex items-center">
                          {deliveryCharge > 0 ? (
                            <>
                              <span className="mr-2">₹</span>
                              <Input
                                type="number"
                                value={deliveryCharge}
                                onChange={(e) => setDeliveryCharge(Number(e.target.value))}
                                className="w-24 border-0 bg-transparent p-0 text-right focus-visible:ring-0 print:hidden"
                                min="0"
                                step="0.01"
                              />
                              <span className="hidden print:block text-invoice-text">
                                {deliveryCharge.toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <span className="font-medium text-invoice-text">Free</span>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between py-3 border-t-2 border-border font-bold text-lg text-invoice-header">
                      <span>Total:</span>
                      <span className="text-success">₹ {calculateFinalTotal().toFixed(2)}</span>
                    </div>
                    <div className="text-sm italic text-invoice-text">
                      Amount in words: {convertToWords(calculateFinalTotal())}
                    </div>
                  </div>
                </div>

                
                {/* Terms and Conditions */}
                <div className="mt-8 pt-6 border-t border-border">
                  <h3 className="font-semibold text-invoice-header mb-3">Terms & Conditions</h3>
                  <div className="text-sm text-invoice-text space-y-2 text-justify">
                    <p>01) Product Claims: All quality or delivery issues must be reported within 48 hours of receipt. Claims submitted after this period will not be entertained by Flyshaft Private Limited.</p>
                    <p>02) Warranty Service: Defective products covered under warranty will be replaced with equivalent items. If replacement stock is unavailable, customers will receive a proportional refund based on current market value.</p>
                    <p>03) Tax Compliance: Customers must provide valid GST registration details during purchase. Invoices issued without proper GST information will be treated as business-to-consumer transactions, restricting input credit claims.</p>
                    <p>04) Order Processing: All tax identification numbers and business details must be provided accurately at the time of order placement. Modifications to these details cannot be processed after order confirmation.</p>
                    <p className="mt-4 font-medium text-center">This is a computer generated Invoice.</p>
                    <p className="mt-4 font-medium text-center">Thank you!</p>
                    <p className="font-medium text-center">Subject to Barabanki Jurisdiction</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillGenerator;