import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Plus, Printer } from 'lucide-react';
import flyshaftLogo from '@/assets/flyshaft-logo.png';

interface LineItem {
  id: string;
  productName: string;
  hsn: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  gstRate: number;
}

interface CustomerInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
}

interface InvoiceDetails {
  invoiceNumber: string;
  date: string;
  dueDate: string;
}

const BillGenerator = () => {
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', productName: '', hsn: '', quantity: 1, unitPrice: 0, discount: 0, gstRate: 18 }
  ]);
  
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

  // Amount in words conversion
  const convertToWords = (amount: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    const convertHundreds = (num: number): string => {
      let result = '';
      if (num >= 100) {
        result += ones[Math.floor(num / 100)] + ' Hundred ';
        num %= 100;
      }
      if (num >= 20) {
        result += tens[Math.floor(num / 10)] + ' ';
        num %= 10;
      } else if (num >= 10) {
        result += teens[num - 10] + ' ';
        return result;
      }
      if (num > 0) {
        result += ones[num] + ' ';
      }
      return result;
    };

    if (amount === 0) return 'Zero';
    
    const integerPart = Math.floor(amount);
    let result = '';
    
    if (integerPart >= 10000000) {
      result += convertHundreds(Math.floor(integerPart / 10000000)) + 'Crore ';
      amount %= 10000000;
    }
    if (integerPart >= 100000) {
      result += convertHundreds(Math.floor(integerPart / 100000)) + 'Lakh ';
      amount %= 100000;
    }
    if (integerPart >= 1000) {
      result += convertHundreds(Math.floor(integerPart / 1000)) + 'Thousand ';
      amount %= 1000;
    }
    if (integerPart > 0) {
      result += convertHundreds(integerPart);
    }
    
    return result.trim() + ' only';
  };

  const addLineItem = () => {
    const newId = Date.now().toString();
    setLineItems([...lineItems, {
      id: newId,
      productName: '',
      hsn: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      gstRate: 18
    }]);
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
    const gstAmount = (afterDiscount * item.gstRate) / 100;
    return afterDiscount + gstAmount;
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);
  };

  const calculateTotalItemDiscount = () => {
    return lineItems.reduce((sum, item) => {
      const subtotal = item.quantity * item.unitPrice;
      return sum + ((subtotal * item.discount) / 100);
    }, 0);
  };

  const calculateTotalGST = () => {
    return lineItems.reduce((sum, item) => {
      const subtotal = item.quantity * item.unitPrice;
      const discountAmount = (subtotal * item.discount) / 100;
      const afterDiscount = subtotal - discountAmount;
      return sum + ((afterDiscount * item.gstRate) / 100);
    }, 0);
  };

  const calculateSGST = () => {
    return calculateTotalGST() / 2;
  };

  const calculateIGST = () => {
    return calculateTotalGST() / 2;
  };

  const calculateFinalTotal = () => {
    const subtotal = calculateSubtotal();
    const itemDiscounts = calculateTotalItemDiscount();
    const gstAmount = calculateTotalGST();
    return subtotal - itemDiscounts + gstAmount;
  };

  const handlePrint = () => {
    // Add print-specific styles
    const printStyles = `
      <style>
        @media print {
          body * {
            visibility: hidden;
          }
          .invoice-content, .invoice-content * {
            visibility: visible;
          }
          .invoice-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
          .hidden.print\\:block {
            display: block !important;
          }
        }
      </style>
    `;
    
    const originalStyles = document.head.innerHTML;
    document.head.innerHTML += printStyles;
    
    window.print();
    
    // Clean up styles after printing
    setTimeout(() => {
      document.head.innerHTML = originalStyles;
    }, 1000);
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
                  <img src={flyshaftLogo} alt="Flyshaft Logo" className="w-24 h-24 mx-auto mb-2" />
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
                    onChange={(e) => setInvoiceDetails({...invoiceDetails, invoiceNumber: e.target.value})}
                    placeholder="INV-001"
                  />
                </div>
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={invoiceDetails.date}
                    onChange={(e) => setInvoiceDetails({...invoiceDetails, date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={invoiceDetails.dueDate}
                    onChange={(e) => setInvoiceDetails({...invoiceDetails, dueDate: e.target.value})}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="customerAddress">Address</Label>
                  <Textarea
                    id="customerAddress"
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                    placeholder="123 Main St, City, State, ZIP"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">Phone</Label>
                  <Input
                    id="customerPhone"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                    placeholder="john@example.com"
                  />
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Right Side - Bill Preview */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardContent className="p-8 invoice-content">
                {/* Bill Header */}
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center space-x-4">
                    <img src={flyshaftLogo} alt="Flyshaft Logo" className="w-16 h-16" />
                    <div>
                      <h1 className="text-2xl font-bold text-invoice-header">Flyshaft</h1>
                      <p className="text-invoice-text">Professional Services</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h2 className="text-2xl font-bold text-invoice-header mb-2">INVOICE</h2>
                    {invoiceDetails.invoiceNumber && (
                      <p className="text-invoice-text">#{invoiceDetails.invoiceNumber}</p>
                    )}
                  </div>
                </div>

                {/* Invoice Details & Customer Info */}
                <div className="grid md:grid-cols-3 gap-8 mb-8">
                  <div>
                    <h3 className="font-semibold text-invoice-header mb-3">Bill To:</h3>
                    <div className="text-invoice-text space-y-1">
                      {customerInfo.name && <p className="font-medium">{customerInfo.name}</p>}
                      {customerInfo.address && <p className="whitespace-pre-line">{customerInfo.address}</p>}
                      {customerInfo.phone && <p>{customerInfo.phone}</p>}
                      {customerInfo.email && <p>{customerInfo.email}</p>}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-invoice-header mb-3">Company Details:</h3>
                    <div className="text-invoice-text space-y-1">
                      <p className="font-medium">Flyshaft Technologies</p>
                      <p>123 Tech Park, Electronic City</p>
                      <p>Bangalore, Karnataka - 560100</p>
                      <p>Phone: +91 80 1234 5678</p>
                      <p>GST No: 29ABCDE1234F1Z5</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="space-y-2 text-invoice-text">
                      {invoiceDetails.date && (
                        <div className="flex justify-end">
                          <span className="w-20 text-left">Date:</span>
                          <span className="font-medium">{new Date(invoiceDetails.date).toLocaleDateString()}</span>
                        </div>
                      )}
                      {invoiceDetails.dueDate && (
                        <div className="flex justify-end">
                          <span className="w-20 text-left">Due Date:</span>
                          <span className="font-medium">{new Date(invoiceDetails.dueDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="mb-8">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-border">
                          <th className="text-left py-3 px-2 font-semibold text-invoice-header">Product/Service</th>
                          <th className="text-center py-3 px-2 font-semibold text-invoice-header">HSN</th>
                          <th className="text-center py-3 px-2 font-semibold text-invoice-header">Qty</th>
                          <th className="text-right py-3 px-2 font-semibold text-invoice-header">Rate (₹)</th>
                          <th className="text-right py-3 px-2 font-semibold text-invoice-header">Discount</th>
                          <th className="text-right py-3 px-2 font-semibold text-invoice-header">GST</th>
                          <th className="text-right py-3 px-2 font-semibold text-invoice-header">Total</th>
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
                                placeholder="Product name"
                                className="border-0 bg-transparent p-0 focus-visible:ring-0 print:hidden"
                              />
                              <span className="hidden print:block text-invoice-text">{item.productName}</span>
                            </td>
                            <td className="py-3 px-2 text-center">
                              <Input
                                value={item.hsn}
                                onChange={(e) => updateLineItem(item.id, 'hsn', e.target.value)}
                                placeholder="HSN"
                                className="border-0 bg-transparent p-0 text-center focus-visible:ring-0 print:hidden"
                              />
                              <span className="hidden print:block text-invoice-text">{item.hsn}</span>
                            </td>
                            <td className="py-3 px-2 text-center">
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateLineItem(item.id, 'quantity', Number(e.target.value))}
                                className="border-0 bg-transparent p-0 text-center focus-visible:ring-0 print:hidden"
                                min="1"
                              />
                              <span className="hidden print:block text-invoice-text">{item.quantity}</span>
                            </td>
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
                                {item.unitPrice > 0 ? `₹${item.unitPrice.toFixed(2)}` : ''}
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
                            <td className="py-3 px-2 text-right">
                              <Input
                                type="number"
                                value={item.gstRate}
                                onChange={(e) => updateLineItem(item.id, 'gstRate', Number(e.target.value))}
                                className="border-0 bg-transparent p-0 text-right focus-visible:ring-0 print:hidden"
                                min="0"
                                max="100"
                              />
                              <span className="hidden print:block text-invoice-text">
                                {item.gstRate > 0 ? `${item.gstRate}%` : ''}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-right font-medium text-invoice-text">
                              ₹{calculateLineTotal(item).toFixed(2)}
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

                {/* Summary */}
                <div className="flex justify-end">
                  <div className="w-80 space-y-2">
                    <div className="flex justify-between py-2 text-invoice-text">
                      <span>Subtotal:</span>
                      <span>₹{calculateSubtotal().toFixed(2)}</span>
                    </div>
                    
                    {calculateTotalItemDiscount() > 0 && (
                      <div className="flex justify-between py-2 text-invoice-text">
                        <span>Item Discounts:</span>
                        <span>-₹{calculateTotalItemDiscount().toFixed(2)}</span>
                      </div>
                    )}


                    {calculateSGST() > 0 && (
                      <div className="flex justify-between py-2 text-invoice-text">
                        <span>SGST:</span>
                        <span>₹{calculateSGST().toFixed(2)}</span>
                      </div>
                    )}

                    {calculateIGST() > 0 && (
                      <div className="flex justify-between py-2 text-invoice-text">
                        <span>IGST:</span>
                        <span>₹{calculateIGST().toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between py-3 border-t-2 border-border font-bold text-lg text-invoice-header">
                      <span>Total:</span>
                      <span className="text-success">₹{calculateFinalTotal().toFixed(2)}</span>
                    </div>

                    <div className="pt-2 text-sm text-invoice-text">
                      <span className="font-semibold">Amount in Words: </span>
                      <span className="capitalize">{convertToWords(calculateFinalTotal())}</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-12 pt-8 border-t border-border text-center text-sm text-invoice-light">
                  <p>Thank you for your business!</p>
                  <p className="mt-2 text-xs">This is a computer generated invoice</p>
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