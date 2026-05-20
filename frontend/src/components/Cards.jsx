import React from 'react'
import { formatMoney } from '../utils/formatMoney.js'

const Cards = ({ data }) => {
  const cardData = [
    { title: 'Total Revenue', value: data?.totalRevenue || 0, color: 'bg-blue-500', isCurrency: true },
    { title: 'This Month', value: data?.monthlyRevenue || 0, color: 'bg-green-500', isCurrency: true },
    { title: 'Total Orders', value: data?.totalOrders || 0, color: 'bg-purple-500', isCurrency: false },
    { title: 'Active Clients', value: data?.activeClients || 0, color: 'bg-orange-500', isCurrency: false },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cardData.map((card, index) => (
        <div key={index} className={`${card.color} rounded-xl p-6 text-white shadow-lg`}>
          <h3 className="text-sm font-medium opacity-90">{card.title}</h3>
          <p className="text-3xl font-bold mt-2">
            {card.isCurrency ? formatMoney(card.value) : card.value}
          </p>
        </div>
      ))}
    </div>
  )
}

export default Cards