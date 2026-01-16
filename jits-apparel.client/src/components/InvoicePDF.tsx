import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from '@react-pdf/renderer';
import { InvoiceData } from '../services/api';

// Register Yesteryear font for brand name
import YesteryearFont from '../assets/fonts/Yesteryear-Regular.ttf';

Font.register({
  family: 'Yesteryear',
  src: YesteryearFont,
});

// Brand colors
const colors = {
  pink: '#ec4899',
  orange: '#f97316',
  cyan: '#06b6d4',
  dark: '#1f2937',
  gray: '#6b7280',
  lightGray: '#f3f4f6',
  white: '#ffffff',
};

// Styles - using Helvetica (built-in PDF font)
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: colors.dark,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: colors.pink,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  brandTextContainer: {
    flexDirection: 'column',
  },
  brandName: {
    fontSize: 28,
    fontFamily: 'Yesteryear',
    color: colors.pink,
  },
  brandTagline: {
    fontSize: 9,
    color: colors.gray,
    marginTop: 2,
  },
  invoiceInfo: {
    textAlign: 'right',
  },
  invoiceTitle: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: colors.dark,
    marginBottom: 8,
  },
  invoiceNumber: {
    fontSize: 11,
    color: colors.gray,
    marginBottom: 4,
  },
  invoiceDate: {
    fontSize: 10,
    color: colors.gray,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: colors.pink,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  twoColumn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 40,
  },
  column: {
    flex: 1,
  },
  addressBlock: {
    backgroundColor: colors.lightGray,
    padding: 12,
    borderRadius: 4,
  },
  addressName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  addressLine: {
    fontSize: 10,
    color: colors.gray,
    marginBottom: 2,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.dark,
    padding: 10,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableHeaderText: {
    color: colors.white,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  tableRowAlt: {
    backgroundColor: '#fafafa',
  },
  colProduct: {
    flex: 3,
  },
  colVariant: {
    flex: 1.5,
  },
  colQty: {
    flex: 0.8,
    textAlign: 'center',
  },
  colPrice: {
    flex: 1,
    textAlign: 'right',
  },
  colSubtotal: {
    flex: 1,
    textAlign: 'right',
  },
  productName: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  variantText: {
    fontSize: 9,
    color: colors.gray,
  },
  subtotalText: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
  },
  totalsSection: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: colors.lightGray,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 6,
  },
  totalsLabel: {
    width: 100,
    textAlign: 'right',
    fontSize: 10,
    color: colors.gray,
    marginRight: 20,
  },
  totalsValue: {
    width: 80,
    textAlign: 'right',
    fontSize: 10,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.dark,
  },
  grandTotalLabel: {
    width: 100,
    textAlign: 'right',
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginRight: 20,
  },
  grandTotalValue: {
    width: 80,
    textAlign: 'right',
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: colors.pink,
  },
  paymentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.lightGray,
    padding: 15,
    borderRadius: 4,
    marginTop: 20,
  },
  paymentItem: {
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: 9,
    color: colors.gray,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  paymentValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  paymentStatusPaid: {
    color: '#22c55e',
  },
  paymentStatusPending: {
    color: colors.orange,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  footerText: {
    fontSize: 9,
    color: colors.gray,
    marginBottom: 4,
  },
  footerBrand: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.pink,
  },
  gradientBar: {
    height: 4,
    marginBottom: 20,
    backgroundColor: colors.pink,
  },
});

interface InvoicePDFProps {
  invoice: InvoiceData;
  logoBase64?: string;
}

export function InvoicePDF({ invoice, logoBase64 }: InvoicePDFProps) {
  const formatCurrency = (amount: number) => `R${amount.toFixed(2)}`;
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getPaymentStatusStyle = (status: string) => {
    const lower = status.toLowerCase();
    if (lower === 'paid' || lower === 'completed') return styles.paymentStatusPaid;
    return styles.paymentStatusPending;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Gradient bar at top */}
        <View style={styles.gradientBar} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            {logoBase64 && (
              <Image style={styles.logo} src={logoBase64} />
            )}
            <View style={styles.brandTextContainer}>
              <Text style={styles.brandName}>{invoice.storeName || 'Jits'}</Text>
              <Text style={styles.brandTagline}>Premium Streetwear</Text>
              {invoice.vatNumber && (
                <Text style={styles.brandTagline}>VAT No: {invoice.vatNumber}</Text>
              )}
              {invoice.storeAddress && (
                <Text style={styles.brandTagline}>{invoice.storeAddress}</Text>
              )}
            </View>
          </View>
          <View style={styles.invoiceInfo}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
            <Text style={styles.invoiceDate}>Date: {formatDate(invoice.orderDate)}</Text>
            <Text style={styles.invoiceDate}>Order: {invoice.orderNumber}</Text>
          </View>
        </View>

        {/* Bill To / Ship To */}
        <View style={styles.section}>
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <Text style={styles.sectionTitle}>Bill To</Text>
              <View style={styles.addressBlock}>
                <Text style={styles.addressName}>{invoice.customerName}</Text>
                <Text style={styles.addressLine}>{invoice.customerEmail}</Text>
                {invoice.customerPhone && (
                  <Text style={styles.addressLine}>{invoice.customerPhone}</Text>
                )}
              </View>
            </View>
            {invoice.shippingAddress && (
              <View style={styles.column}>
                <Text style={styles.sectionTitle}>Ship To</Text>
                <View style={styles.addressBlock}>
                  <Text style={styles.addressName}>{invoice.shippingAddress.fullName}</Text>
                  <Text style={styles.addressLine}>{invoice.shippingAddress.addressLine1}</Text>
                  {invoice.shippingAddress.addressLine2 && (
                    <Text style={styles.addressLine}>{invoice.shippingAddress.addressLine2}</Text>
                  )}
                  <Text style={styles.addressLine}>
                    {invoice.shippingAddress.city}, {invoice.shippingAddress.province} {invoice.shippingAddress.postalCode}
                  </Text>
                  <Text style={styles.addressLine}>{invoice.shippingAddress.country}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.colProduct]}>Product</Text>
              <Text style={[styles.tableHeaderText, styles.colVariant]}>Variant</Text>
              <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
              <Text style={[styles.tableHeaderText, styles.colPrice]}>Price</Text>
              <Text style={[styles.tableHeaderText, styles.colSubtotal]}>Subtotal</Text>
            </View>

            {/* Table Rows */}
            {invoice.items.map((item, index) => {
              const variant = [item.size, item.color].filter(Boolean).join(' / ') || 'Standard';
              return (
                <View
                  key={index}
                  style={index % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}
                >
                  <Text style={[styles.productName, styles.colProduct]}>{item.productName}</Text>
                  <Text style={[styles.variantText, styles.colVariant]}>{variant}</Text>
                  <Text style={[styles.colQty, { textAlign: 'center' }]}>{item.quantity}</Text>
                  <Text style={[styles.colPrice, { textAlign: 'right' }]}>{formatCurrency(item.unitPrice)}</Text>
                  <Text style={[styles.subtotalText, styles.colSubtotal]}>
                    {formatCurrency(item.subtotal)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal (excl. VAT):</Text>
            <Text style={styles.totalsValue}>{formatCurrency(invoice.subtotal)}</Text>
          </View>
          {invoice.tax > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>VAT ({invoice.taxRate || 15}%):</Text>
              <Text style={styles.totalsValue}>{formatCurrency(invoice.tax)}</Text>
            </View>
          )}
          {invoice.shipping > 0 ? (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>
                Shipping{invoice.serviceLevelName ? ` (${invoice.serviceLevelName})` : ''}:
              </Text>
              <Text style={styles.totalsValue}>{formatCurrency(invoice.shipping)}</Text>
            </View>
          ) : (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Shipping:</Text>
              <Text style={[styles.totalsValue, { color: '#22c55e' }]}>Free</Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total (incl. VAT):</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(invoice.total)}</Text>
          </View>
        </View>

        {/* Payment Info */}
        <View style={styles.paymentInfo}>
          <View style={styles.paymentItem}>
            <Text style={styles.paymentLabel}>Payment Method</Text>
            <Text style={styles.paymentValue}>{invoice.paymentMethod || 'N/A'}</Text>
          </View>
          <View style={styles.paymentItem}>
            <Text style={styles.paymentLabel}>Payment Status</Text>
            <Text style={[styles.paymentValue, getPaymentStatusStyle(invoice.paymentStatus)]}>
              {invoice.paymentStatus}
            </Text>
          </View>
          <View style={styles.paymentItem}>
            <Text style={styles.paymentLabel}>Invoice Date</Text>
            <Text style={styles.paymentValue}>{formatDate(invoice.orderDate)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Thank you for shopping with us!</Text>
          <Text style={styles.footerText}>
            Questions? Contact us at {invoice.storeEmail || 'support@jitsapparel.co.za'}
          </Text>
          <Text style={styles.footerBrand}>{(invoice.storeName || 'JITS APPAREL').toUpperCase()} - Premium Streetwear</Text>
        </View>
      </Page>
    </Document>
  );
}
