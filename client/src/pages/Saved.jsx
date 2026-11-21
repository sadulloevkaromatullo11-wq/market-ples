import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Empty, PageHead, ProductCard } from '../components'
import { api } from '../api'
import { useFavs } from '../favs'

export default function Saved() {
  const favs = useFavs()
  const [products, setProducts] = useState(null)

  useEffect(() => {
    api('/products').then((data) => setProducts(data.products)).catch(() => setProducts([]))
  }, [])

  const saved = (products || []).filter((product) => favs.includes(product.id))

  return (
    <div className="page">
      <PageHead title="Дӯстдошта" />
      {!products && <div className="mx-4 mt-4 h-28 animate-pulse rounded-2xl bg-line" />}
      {products && saved.length === 0 && <Empty title="Ҳанӯз холӣ аст" text="Дили молро пахш кунед, то ин ҷо нигоҳ дошта шавад." action={<Link to="/catalog" className="btn">Ба каталог</Link>} />}
      {saved.length > 0 && (
        <div className="shelf grid grid-cols-2 gap-x-3 gap-y-4 px-4 pt-4">
          {saved.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      )}
    </div>
  )
}
