export const UPLOADS_URL = process.env.NEXT_PUBLIC_UPLOADS_URL || 'http://localhost:4000/uploads';

export function getImageUrl(path: string | undefined | null): string {
  if (!path) return '/placeholder.jpg';
  if (path.startsWith('http')) return path;
  if (path.startsWith('/uploads')) return `${UPLOADS_URL.replace('/uploads', '')}${path}`;
  return `${UPLOADS_URL}/${path}`;
}

export function formatPrice(price: number): string {
  return `Rs. ${price?.toLocaleString('en-PK') || '0'}`;
}

export function getDiscount(price: number, discountPrice: number | null): number {
  if (!discountPrice || discountPrice >= price) return 0;
  return Math.round(((price - discountPrice) / price) * 100);
}

export const CITIES = [
  'Abbottabad', 'Ahmadpur East', 'Attock', 'Bahawalnagar', 'Bahawalpur',
  'Bannu', 'Batagram', 'Bhakkar', 'Burewala', 'Chakwal',
  'Chaman', 'Charsadda', 'Chiniot', 'Chishtian', 'Dadu',
  'Daska', 'Dera Ghazi Khan', 'Dera Ismail Khan', 'Faisalabad', 'Fateh Jang',
  'Ghotki', 'Gojra', 'Gujranwala', 'Gujrat', 'Gwadar',
  'Hafizabad', 'Haripur', 'Haroonabad', 'Hassan Abdal', 'Haveli Lakha',
  'Hub', 'Hyderabad', 'Islamabad', 'Jacobabad', 'Jaranwala',
  'Jatoi', 'Jhelum', 'Jhang', 'Kamalia', 'Kamoke',
  'Kandhkot', 'Karachi', 'Kasur', 'Khairpur', 'Khanewal',
  'Khanpur', 'Kharian', 'Khushab', 'Khuzdar', 'Kohat',
  'Kot Addu', 'Kot Abdul Malik', 'Lahore', 'Lalamusa', 'Larkana',
  'Layyah', 'Liaquatpur', 'Lodhran', 'Mandi Bahauddin', 'Mansehra',
  'Mardan', 'Mianwali', 'Mingora', 'Mirpur', 'Mirpur Khas',
  'Mirpur Mathelo', 'Multan', 'Muridke', 'Murree', 'Muzaffarabad',
  'Muzaffargarh', 'Narowal', 'Nawabshah', 'Nowshera', 'Okara',
  'Pakpattan', 'Pano Aqil', 'Pasrur', 'Pattoki', 'Peshawar',
  'Quetta', 'Rahim Yar Khan', 'Rajanpur', 'Rawalpindi', 'Renala Khurd',
  'Sadiqabad', 'Sahiwal', 'Samundri', 'Sanghar', 'Sargodha',
  'Shahdadkot', 'Shahdadpur', 'Shahkot', 'Sheikhupura', 'Shikarpur',
  'Shorkot', 'Sialkot', 'Sibi', 'Sukkur', 'Swabi',
  'Swat', 'Talagang', 'Tando Adam', 'Tando Allahyar', 'Tank',
  'Taxila', 'Toba Tek Singh', 'Turbat', 'Vehari', 'Wah Cantt',
  'Wazirabad', 'Zhob', 'Other',
];
