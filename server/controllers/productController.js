import { v2 as cloudinary } from "cloudinary";
import Product from "../models/Product.js";
import { recordMetric } from "../configs/cloudwatch.js";

// Add Product : api/product/add
export const addProduct = async (req, res) => {
  try {
    let productData = JSON.parse(req.body.productData);

    const images = req.files;
    // Promise.all đợi tất cả ảnh tải lên rồi mới thực thi
    let imagesUrl = await Promise.all(
      images.map(async (item) => {
        let result = await cloudinary.uploader.upload(item.path, {
          resource_type: "image",
        });
        //return về đường dẫn
        return result.secure_url;
      })
    );

    await Product.create({ ...productData, image: imagesUrl });

    res.json({ success: true, message: "Product Added" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
// Get Product : api/product/list
export const productList = async (req, res) => {
  try {
    const start = process.hrtime.bigint();
    const products = await Product.find({});
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;

    console.log(
      JSON.stringify({
        type: "database_query",
        collection: "products",
        operation: "Product.find",
        duration_ms: Number(durationMs.toFixed(2)),
        result_count: products.length,
        timestamp: new Date().toISOString(),
      })
    );

    void recordMetric("MongoQueryLatencyMs", durationMs, "Milliseconds", [
      { Name: "Operation", Value: "ProductList" },
      { Name: "Collection", Value: "products" },
    ]);

    res.json({ success: true, products });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
// Get single Product : api/product/list/id
export const productById = async (req, res) => {
  try {
    const { id } = req.body;
    const product = await Product.findById(id);
    res.json({ success: true, product });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
// Change Product inStock : api/product/list/stock
export const changeStock = async (req, res) => {
  try {
    const { id, inStock } = req.body;
    const product = await Product.findByIdAndUpdate(id, { inStock });
    res.json({ success: true, message: "Stock Updated", product });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
// Delete Product inStock : api/product/list/stock
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.body;
    const product = await Product.findByIdAndDelete(id);
    res.json({ success: true, message: "Delete Product", product });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
