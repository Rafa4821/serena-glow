import TopBar from './TopBar/TopBar'
import Navbar from './Navbar/Navbar'
import Footer from './Footer/Footer'

export default function PublicLayout({ children }) {
  return (
    <>
      <TopBar />
      <Navbar />
      <main className="page-offset">
        {children}
      </main>
      <Footer />
    </>
  )
}
