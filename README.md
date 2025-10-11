# KIND HEART'S

A web application for partner registration system connecting restaurants, hotels, and kitchens with the foundation to reduce food waste and fight hunger.

## Features

### 🏠 Landing Page
- Hero section with clear call-to-action buttons
- Information about the organization's mission
- How it works section
- Contact information

- Organization details collection
- Food capacity and type specification
- Pickup scheduling preferences

### 📊 Admin Dashboard (dashboard.html)
- View all partner registrations
- Filter by type (Partner), status, city
- Search functionality
- Visual indicators for different submission types
- Secure admin authentication

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Supabase (PostgreSQL database)
- **Styling**: Custom CSS with mobile-first responsive design
- **Fonts**: Poppins (headings) and Roboto (body text)

## Color Palette

- **Primary**: #0F766E (Teal)
- **Accent**: #F59E0B (Amber)
- **Background**: #F8FAFC
- **Cards**: #FFFFFF

## Setup Instructions

### 1. Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor (for the `registrations` table)
3. Update the credentials in `supabase-client.js`:
   ```javascript
   const supabaseUrl = 'YOUR_SUPABASE_URL';
   const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
   ```

**Note**: The system uses the `registrations` table for partner/hotel/restaurant registrations

### 2. File Structure

```
/
├── index.html              # Landing page
├── dashboard.html          # Admin dashboard
├── styles.css              # Global styles
├── app.js                  # Form handling and validation
├── supabase-client.js      # Database client configuration
├── supabase-schema.sql     # Database schema
└── README.md              # This file
```

### 3. Local Development

1. Serve the files using a local server:
   ```bash
   # Using Python
   python -m http.server 8000

   # Using Node.js
   npx serve .

   # Using PHP
   php -S localhost:8000
   ```

2. Open `http://localhost:8000` in your browser

## Usage Guide

### For Partners (Hotels/Restaurants/Kitchens)

3. Specify food capacity and pickup preferences
4. Submit for admin approval

### For Administrators

1. Login to the admin dashboard (`admin-login.html`)
2. View all partner registrations in the dashboard
3. Filter by status, city, or search by organization name
4. Review and approve/reject registrations

## Sample Data

### Partner Registration Example
```json
{
  "type": "partner",
  "org_type": "restaurant",
  "org_name": "Green Garden Restaurant",
  "contact_person": "Rajesh Kumar",
  "phone": "9876543210",
  "email": "info@greengarden.com",
  "address": "123 MG Road",
  "city": "Aurangabad",
  "state": "Bihar",
  "pincode": "824101",
  "pickup_days": "Monday, Wednesday, Friday",
  "pickup_time": "4 PM - 6 PM",
  "food_capacity": "50 meals",
  "food_type": "Both",
  "status": "Pending Review"
}
```


## Form Validation

### Client-Side Validation
- Required field validation
- Email format validation
- Phone number format (10 digits)
- Pincode format (6 digits)
- Real-time feedback with error messages

### Features
- Disabled submit button during form submission
- Loading spinner animation
- Success/error toast notifications
- Form reset after successful submission

## Responsive Design

- **Mobile-first approach**
- Hamburger menu for mobile navigation
- Optimized layouts for:
  - Mobile (< 768px)
  - Tablet (768px - 1023px)
  - Desktop (1024px+)
- Touch-friendly interface elements

## Security Features

### Admin Dashboard
- Session-based authentication
- Automatic session expiry
- Password change functionality
- Console log filtering
- Disabled developer tools shortcuts

### Form Security
- Honeypot field for spam protection
- Input sanitization
- Rate limiting considerations
- HTTPS enforcement

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For technical support or questions:
- Email: kindheartssangam@gmail.com
- Phone: +91-XXXX-XXXXXX

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Note**: This system is designed to help reduce food waste and fight hunger by connecting surplus food with those in need. All donations and partnerships are greatly appreciated!