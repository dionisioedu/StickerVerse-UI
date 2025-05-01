import './Footer.css'

const Footer = () => {
  return (
    <footer className="footer">
      <p>
        © {new Date().getFullYear()} <a href="https://dionisio.dev" target="_blank" rel="noopener noreferrer">dionisio.dev</a>
      </p>
    </footer>
  )
}

export default Footer
