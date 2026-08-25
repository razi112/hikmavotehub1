# Hikma Vote Hub

Product Requirements Document (PRD)



Hikma Class Union Committee Election Platform (MVP)



1. Project Overview



Project Name



Hikma Vote



Tagline



"Every Vote Matters."



Purpose



Hikma Vote is a modern, secure, and responsive online voting platform built for the Hikma Class Union Committee Election. Students can securely vote for their preferred candidates, while administrators manage the election through a powerful dashboard with live analytics and reports.





---



2. Design Vision



The website should have a premium, modern, and elegant appearance inspired by Apple, Linear, Stripe, and Vercel.



Design Style



Minimal UI



Glassmorphism



Rounded corners



Soft shadows



Premium gradients



Responsive layout



Smooth scrolling



Beautiful loading animations



Hover lift effects



Animated buttons



Fade-in on scroll



Page transition animations



Interactive cards



Modern typography (Poppins + Inter)







---



3. Color Palette



Primary



Emerald Green (#16A34A)





Secondary



White (#FFFFFF)





Background



#F8FAFC





Dark



#0F172A





Accent



Gold (#F59E0B)







---



4. User Roles



Student



View candidates



Vote once per position



View election information





Admin



Manage candidates



Manage positions



Monitor votes



View analytics



Publish results



Configure election settings







---



5. Home Page



Hero Section



Large title:



> Hikma Class Union Committee Election 2026







Subtitle:



> Choose your leaders with confidence. Every vote shapes the future of our class.







Buttons:



Vote Now



View Candidates





Background:



Animated gradient



Floating shapes



Glass effect



Smooth entrance animation







---



Election Countdown



Display:



Days



Hours



Minutes



Seconds







---



About Election



Brief introduction explaining:



Purpose of the election



Importance of student participation



Election rules







---



6. Executive Committee Positions



The following positions will be available for voting.



President



Candidates:



Hafiz Muhammed Ziyad



Hafiz Muhammad Anzil







---



Secretary



Candidates:



Hafiz Muhammed Fawaz



Hafiz Muhammed Ashkar



Hafiz Muhammed Munfis







---



Vice President



Candidates:



(To be added by Admin)







---



Joint Secretary



Candidates:



(To be added by Admin)







---



Working Secretary



Candidates:



(To be added by Admin)







---



Treasurer



Candidates:



Hafiz Muhammed Shadi



Hafiz Muhammed Midlaj







---



7. Candidate Cards



Each candidate card should contain:



Large Profile Photo Placeholder



Candidate Name



Position



Class (Optional)



Short Description



Vote Button





Hover Effects



Card lift animation



Shadow increase



Image zoom



Animated border



Button ripple effect



Smooth transitions (300ms)





Admin should later upload the real profile photos.





---



8. Voting Page



Voting Process



Step 1



Choose Position



↓



Step 2



Select Candidate



↓



Step 3



Confirm Vote



↓



Step 4



Vote Submitted Successfully





---



Vote Confirmation



Popup



> Are you sure you want to vote for this candidate?







Buttons



Confirm



Cancel







---



Success Animation



Green Tick



Confetti



Thank You Message







---



9. Admin Dashboard



Modern Sidebar



Dashboard



Candidates



Positions



Students



Votes



Analytics



Results



Settings



Logout







---



Dashboard Overview



Cards



Total Candidates



Total Students



Total Votes



Voting Percentage



Election Status







---



Candidate Management



Admin can



Add Candidate



Edit Candidate



Delete Candidate



Upload Profile Photo



Assign Position



Change Display Order



Enable/Disable Candidate







---



Position Management



Admin can



Create Position



Edit Position



Delete Position



Arrange Display Order







---



Student Management



Add Students



Import Student List



Search Students



Block Student



Enable Student



Check Voting Status







---



Live Vote Monitoring



Admin can see



Live Vote Count



Recent Votes



Total Votes



Voting Percentage







---



10. Analytics Dashboard



Each candidate should have a dedicated analytics card.



Graphs



📊 Bar Chart



Votes per Candidate





🥧 Pie Chart



Position-wise Vote Distribution





📈 Line Chart



Voting Trend Throughout the Day





📉 Progress Graph



Percentage of Students Who Have Voted







Each graph updates in real time.





---



11. Results Page



After voting ends:



Display



Winner for each position



Vote Count



Percentage



Winning Margin





Beautiful winner card



Gold badge



Celebration animation



Confetti





---



12. Settings



Admin can change



Website Name



Logo



Election Date



Start Time



End Time



Open Voting



Close Voting



Theme Color







---



13. Database Structure



Candidates



id



name



position



class



bio



image



vote_count





Positions



id



title



display_order





Students



id



name



admission_number



class



has_voted





Votes



id



student_id



candidate_id



position



timestamp





Settings



website_name



election_status



start_time



end_time



logo







---



14. Security



One vote per position



Secure authentication



Duplicate vote prevention



Admin-only dashboard



Activity logs



Vote confirmation before submission



Automatic vote locking after submission







---



15. Responsive Design



Fully optimized for:



Mobile



Tablet



Laptop



Desktop







---



16. Tech Stack



Frontend



React



Vite



TypeScript



Tailwind CSS



Framer Motion



React Router





Backend



Supabase





Authentication



Google Login (Admin)



Student ID / Admission Number Login





Storage



Supabase Storage





Hosting



Vercel







---



17. Future Enhancements



QR Code Voting



Face Verification



Multi-language Support (English, Malayalam, Arabic)



Email Notifications





Announcement Section



Candidate Manifesto Pages



Dark Mode



PDF Result Export



Printable Reports



Audit Trail



Real-time Leaderboard



Winner Celebration Page







---



18. MVP Success Criteria



Students can securely vote once for each position.



Admin can manage candidates, positions, and election settings.



Live vote counts and real-time analytics are available.



Results are automatically generated after voting ends.



The website is responsive, modern, and features smooth hover animations, premium transitions, and an intuitive user experience suitable for the Hikma Class Union Committee Election.

Yes. Add the following section to the PRD:





---



19. Mobile Responsiveness (High Priority)



The website must be mobile-first and fully responsive because most students will vote using their smartphones.



Supported Devices



Android Phones



iPhones (iOS)



Tablets



Laptops



Desktop Computers







---



Mobile UI Requirements



Navigation



Responsive Navbar



Hamburger Menu



Smooth slide-in mobile menu



Sticky navigation on scroll





Home Page



Hero section optimized for mobile



Responsive typography



Full-width buttons



Mobile-friendly spacing



Optimized images





Candidate Cards



Single-column layout on phones



Large profile photo



Large "Vote Now" button



Touch-friendly card design



Smooth tap animations





Voting Flow



Easy step-by-step voting process



Large touch targets



Fixed "Continue" and "Confirm Vote" buttons



Mobile-friendly confirmation dialog





Admin Dashboard



Responsive collapsible sidebar



Cards stack vertically on small screens



Swipe-friendly tables



Responsive charts and graphs



Mobile-friendly forms and controls







---



Responsive Breakpoints



Mobile: 320px to 767px



Tablet: 768px to 1023px



Laptop: 1024px to 1439px



Desktop: 1440px and above







---



Performance Goals



First page load under 2 seconds



Smooth 60 FPS animations



Optimized images with lazy loading



Fast navigation between pages



SEO-friendly structure



Accessibility compliant (WCAG basics)







---



User Experience



Mobile-first design approach



Smooth hover effects on desktop



Smooth touch feedback on mobile



Framer Motion page transitions



Skeleton loading while data loads



Toast notifications for actions



Beautiful empty states and loading screens



Responsive charts that automatically resize







---



✅ Final MVP Requirement



The Hikma Class Union Committee Election Platform must deliver a premium, Apple-inspired experience with a fully responsive design, ensuring students can vote seamlessly on Android, iPhone, tablets, laptops, and desktops. Every page, animation, graph, form, and dashboard component should adapt perfectly to different screen sizes while maintaining excellent performance and usability.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://hikmavotehub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/014f7c76-7de2-47d0-bd43-9767fcaa6372).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
