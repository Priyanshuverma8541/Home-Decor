import { useEffect, useState } from "react";
import { ShoppingBag, Clock, TrendingUp, CheckCircle } from "lucide-react";
import { orderAPI } from "../../services/api.js";
import { PageLoader, StatCard } from "../ui/index.jsx";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import toast from "react-hot-toast";

const COLORS = ["#c96030","#1a8e72","#b89248","#6b5040"];

export default function Analytics() {
  const [data, setData] = useState(null);
  useEffect(() => {
    orderAPI.analytics().then(({ data:d })=>setData(d)).catch(()=>toast.error("Failed to load analytics"));
  }, []);

  if (!data) return <PageLoader/>;

  const cityData   = data.cityBreakdown?.map(c=>({ name:c._id, orders:c.count, revenue:c.revenue })) || [];
  const sourceData = data.sourceBreakdown?.map(s=>({ name:s._id, value:s.count })) || [];

  return (
    <div>
      <div style={{ marginBottom:"1.5rem" }}>
        <p className="section-tag">Reports</p>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.75rem", color:"#2c1f14" }}>Analytics</h1>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"0.875rem", marginBottom:"1.5rem" }} className="an-stats">
        <StatCard label="Total Orders"   value={data.stats?.totalOrders||0}   sub={`${data.stats?.todayOrders||0} today`}        color="#c96030" icon={ShoppingBag}/>
        <StatCard label="Pending"        value={data.stats?.pendingOrders||0} sub="Need fulfilment"                               color="#e38345" icon={Clock}/>
        <StatCard label="Delivered"      value={data.stats?.deliveredOrders||0} sub="All time"                                    color="#1a8e72" icon={CheckCircle}/>
        <StatCard label="Revenue (paid)" value={`Rs.${(data.stats?.totalRevenue||0).toLocaleString("en-IN")}`} sub="Paid orders"  color="#b89248" icon={TrendingUp}/>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:"1.25rem" }} className="an-charts">
        <div className="card" style={{ padding:"1.25rem" }}>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1rem", color:"#2c1f14", marginBottom:"1rem" }}>Orders by City</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={cityData} margin={{ top:0,right:0,left:-20,bottom:0 }}>
              <XAxis dataKey="name" tick={{ fontSize:11,fill:"#8c7060" }}/>
              <YAxis tick={{ fontSize:11,fill:"#8c7060" }}/>
              <Tooltip contentStyle={{ fontSize:12,background:"#2c1f14",color:"#fdf8f2",border:"none",borderRadius:8 }}/>
              <Bar dataKey="orders" fill="#c96030" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card" style={{ padding:"1.25rem" }}>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1rem", color:"#2c1f14", marginBottom:"1rem" }}>Orders by Source</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={sourceData} cx="50%" cy="50%" outerRadius={70} dataKey="value" fontSize={10}
                label={({name,value})=>`${name}: ${value}`} labelLine={false}>
                {sourceData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
              </Pie>
              <Tooltip contentStyle={{ fontSize:12,background:"#2c1f14",color:"#fdf8f2",border:"none",borderRadius:8 }}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <style>{`@media(min-width:768px){.an-stats{grid-template-columns:repeat(4,1fr)!important}.an-charts{grid-template-columns:1fr 1fr!important}}`}</style>
    </div>
  );
}
