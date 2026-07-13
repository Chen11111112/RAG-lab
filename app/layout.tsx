export default function Layout({children}: 
  {children: React.ReactNode;}){ // Prop
  return (
    <>
      <h1>我是Layout</h1>
      <h2>你也可以叫我NavBar、SideBar</h2>
      
      {children}

      <footer>@HyC 版權所有</footer>
    </>
  )
}
// REACT
// Components -> DOM Node