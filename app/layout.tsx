export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-Hant">
      <body>
        <h1>我是Layout</h1>
        <h2>你也可以叫我NavBar、SideBar</h2>

        {children}

        <footer>@HyC 版權所有</footer>
      </body>
    </html>
  )
}
